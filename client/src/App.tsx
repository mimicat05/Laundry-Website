import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { OrdersView } from "@/pages/orders-view";

// Protected Route Wrapper
const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
};

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/pending">
        {() => <ProtectedRoute component={() => (
          <OrdersView 
            status="pending" 
            title="Pending Orders" 
            description="Orders waiting to be washed." 
          />
        )} />}
      </Route>

      <Route path="/washed">
        {() => <ProtectedRoute component={() => (
          <OrdersView 
            status="washed" 
            title="Washed Orders" 
            description="Orders that have been processed and need to be packed." 
          />
        )} />}
      </Route>

      <Route path="/pickup">
        {() => <ProtectedRoute component={() => (
          <OrdersView 
            status="ready_for_pickup" 
            title="Ready for Pickup" 
            description="Clean orders awaiting customer collection." 
          />
        )} />}
      </Route>

      <Route path="/history">
        {() => <ProtectedRoute component={() => (
          <OrdersView 
            status="completed" 
            title="Order History" 
            description="Completed and collected orders." 
          />
        )} />}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
