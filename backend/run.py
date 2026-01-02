import sys
import asyncio
import uvicorn
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # Run uvicorn
    # reload=True is DISABLED because it breaks Windows ProactorEventLoop inheritance for Playwright subprocesses.
    # You must restart the server manually after backend code changes.
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False, loop="asyncio")
