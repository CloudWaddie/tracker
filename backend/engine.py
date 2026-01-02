import asyncio
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List, Dict, Any
from camoufox import AsyncNewBrowser
from playwright.async_api import Page, BrowserContext, async_playwright, Request
import io
import re
import httpx
import json

logger = logging.getLogger(__name__)

class TrackerEngine:
    def __init__(self):
        pass

    async def execute_tracker(self, config: List[Dict[str, Any]]) -> tuple[str, Dict[str, Any]]:
        """
        Executes a sequence of steps defined in the tracker config.
        Returns the execution log and run info.
        """
        log_stream = io.StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
        tracker_logger = logging.getLogger('tracker_exec')
        tracker_logger.setLevel(logging.INFO)
        tracker_logger.addHandler(handler)
        
        tracker_logger.info("Starting tracker execution")
        
        # Determine headless mode from config (default True)
        headless = True
        for step in config:
            if step.get("action") == "open" and "headless" in step:
                headless = bool(step.get("headless"))
                break

        run_info = {
            "grep_matches": [],
            "extracted_variables": {},
            "network_requests_captured": 0
        }

        try:
            # Initialize Playwright and Camoufox
            async with async_playwright() as p:
                browser = await AsyncNewBrowser(p, headless=headless)
                async with browser:
                    context = await browser.new_context()
                    page = await context.new_page()
                    
                    # Network listener
                    captured_requests = []
                    async def on_request(request: Request):
                        captured_requests.append({
                            "url": request.url,
                            "method": request.method,
                            "headers": request.headers
                        })
                    page.on("request", on_request)

                    variables = {} # Execution Context

                    for step in config:
                        await self.execute_step(page, step, variables, tracker_logger, captured_requests, run_info)
                    
                    run_info["extracted_variables"] = variables
                    run_info["network_requests_captured"] = len(captured_requests)

        except Exception as e:
            tracker_logger.error(f"Error executing tracker: {e}")
            raise
        finally:
            handler.close()
            
        return log_stream.getvalue(), run_info

    def _substitute(self, value: Any, variables: Dict[str, Any]) -> Any:
        if isinstance(value, str):
            try:
                return value.format(**variables)
            except KeyError:
                return value
        return value

    async def execute_step(self, page: Page, step: Dict[str, Any], variables: Dict[str, Any], logger, captured_requests: List[Dict], run_info: Dict[str, Any]):
        action = step.get("action")
        logger.info(f"Executing step: {action}")

        if action == "open":
            url = self._substitute(step.get("url"), variables)
            if url:
                await page.goto(url)
                logger.info(f"Opened {url}")
        
        elif action == "wait":
            seconds = float(step.get("seconds", 1))
            await asyncio.sleep(seconds)
            logger.info(f"Waited {seconds}s")
        
        elif action == "screenshot":
            path = self._substitute(step.get("path", "screenshot.png"), variables)
            await page.screenshot(path=path)
            logger.info(f"Screenshot saved to {path}")
        
        elif action == "click":
            selector = self._substitute(step.get("selector"), variables)
            if selector:
                await page.click(selector)
                logger.info(f"Clicked {selector}")
        
        elif action == "type":
            selector = self._substitute(step.get("selector"), variables)
            text = self._substitute(step.get("text"), variables)
            if selector and text:
                await page.fill(selector, text)
                logger.info(f"Typed into {selector}")
        
        elif action == "press_key":
            key = self._substitute(step.get("key"), variables)
            if key:
                await page.keyboard.press(key)
                logger.info(f"Pressed key: {key}")

        elif action == "scroll":
            selector = self._substitute(step.get("selector"), variables)
            if selector:
                await page.locator(selector).scroll_into_view_if_needed()
                logger.info(f"Scrolled to {selector}")

        elif action == "grep":
            text = self._substitute(step.get("text"), variables)
            selector = self._substitute(step.get("selector", "body"), variables)
            if text:
                content = await page.content() if selector == "body" else await page.inner_text(selector)
                if text not in content:
                    raise Exception(f"Grep failed: '{text}' not found in {selector}")
                logger.info(f"Grep success: Found '{text}'")
                run_info["grep_matches"].append({"text": text, "found": True})

        elif action == "grep_regex":
            pattern = self._substitute(step.get("regex"), variables)
            selector = self._substitute(step.get("selector", "body"), variables)
            if pattern:
                content = await page.content() if selector == "body" else await page.inner_text(selector)
                if not re.search(pattern, content):
                    raise Exception(f"Grep Regex failed: '{pattern}' not found")
                logger.info(f"Grep Regex success: Found pattern")
                run_info["grep_matches"].append({"regex": pattern, "found": True})

        elif action == "extract_text":
            selector = self._substitute(step.get("selector"), variables)
            variable_name = step.get("variable")
            if selector and variable_name:
                extracted = await page.inner_text(selector)
                variables[variable_name] = extracted
                logger.info(f"Extracted '{extracted}' to variable '{variable_name}'")

        elif action == "execute_js":
            script = self._substitute(step.get("script"), variables)
            result = await page.evaluate(script)
            logger.info(f"Executed JS. Result: {result}")
            if step.get("variable"):
                variables[step.get("variable")] = result

        elif action == "refresh":
            await page.reload()
            logger.info("Refreshed page")

        elif action == "wait_network_idle":
            await page.wait_for_load_state("networkidle")
            logger.info("Waited for network idle")

        elif action == "clear_cookies":
            await page.context.clear_cookies()
            logger.info("Cleared cookies")

        elif action == "set_header":
            key = self._substitute(step.get("key"), variables)
            value = self._substitute(step.get("value"), variables)
            if key and value:
                await page.set_extra_http_headers({key: value})
                logger.info(f"Set header {key}")

        elif action == "http_request":
            method = step.get("method", "GET")
            url = self._substitute(step.get("url"), variables)
            body = self._substitute(step.get("body"), variables)
            async with httpx.AsyncClient() as client:
                response = await client.request(method, url, content=body)
                logger.info(f"HTTP {method} {url} - Status: {response.status_code}")
                if step.get("variable"):
                    variables[step.get("variable")] = response.text
                variables["last_http_status"] = response.status_code
                variables["last_http_body"] = response.text

        elif action == "expect_http_status":
            expected = int(step.get("status"))
            last_status = variables.get("last_http_status")
            if last_status != expected:
                raise Exception(f"Expected HTTP status {expected}, got {last_status}")
            logger.info(f"Verified HTTP status {expected}")

        elif action == "capture_network":
            pattern = self._substitute(step.get("regex"), variables)
            found = False
            if captured_requests:
                for req in captured_requests:
                    if re.search(pattern, req['url']):
                        found = True
                        break
            if not found:
                raise Exception(f"Network request matching '{pattern}' not found")
            logger.info(f"Found network request matching '{pattern}'")

        elif action == "send_notification":
            message = self._substitute(step.get("message"), variables)
            # Placeholder for webhook implementation
            logger.info(f"NOTIFICATION: {message}")

        else:
            logger.warning(f"Unknown action: {action}")

# Test execution
if __name__ == "__main__":
    # Example usage
    async def main():
        engine = TrackerEngine()
        config = [
            {"action": "open", "url": "https://example.com"},
            {"action": "wait", "seconds": 2},
            {"action": "screenshot", "path": "test_example.png"}
        ]
        await engine.execute_tracker(config)

    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())