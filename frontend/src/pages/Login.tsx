import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export const Login = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check or just store it. 
    // Since the API verifies it, we can just store it and try to use it.
    // Ideally we'd ping an auth endpoint, but we don't have one.
    // So we'll just assume it's right and redirect. The Admin page will fail if it's wrong.
    if (key) {
        localStorage.setItem('adminKey', key);
        navigate('/admin');
    } else {
        setError('Please enter a key');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin secret key to access the console.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Secret Key</Label>
              <Input 
                id="password" 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit">Sign in</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
