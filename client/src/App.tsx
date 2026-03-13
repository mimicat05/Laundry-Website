import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { OrdersView } from "@/pages/orders-view";
import { RecentlyDeleted } from "@/pages/recently-deleted";

const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/staff");
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
      {/* Public landing page */}
      <Route path="/" component={Landing} />

      {/* Staff login */}
      <Route path="/staff" component={Login} />

      {/* Protected Staff Routes */}
      <Route path="/dashboard">
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

      <Route path="/deleted">
        {() => <ProtectedRoute component={RecentlyDeleted} />}
      </Route>

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
