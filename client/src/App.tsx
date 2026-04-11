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
import { CustomerOrder } from "@/pages/customer-order";
import { RequestsView } from "@/pages/requests-view";
import { Reports } from "@/pages/reports";
import { ManageServices } from "@/pages/manage-services";
import { ManageStaff } from "@/pages/manage-staff";
import { CustomerTracking } from "@/pages/customer-tracking";

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

const OwnerRoute = ({ component: Component, ...rest }: any) => {
  const { isAuthenticated, isOwner } = useAuth();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/staff");
    } else if (!isOwner) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isOwner, setLocation]);

  if (!isAuthenticated || !isOwner) return null;

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

      {/* Public customer order form */}
      <Route path="/order" component={CustomerOrder} />

      {/* Public order tracking */}
      <Route path="/track" component={CustomerTracking} />

      {/* Staff login */}
      <Route path="/staff" component={Login} />

      {/* Protected Staff Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>

      <Route path="/requests">
        {() => <ProtectedRoute component={RequestsView} />}
      </Route>

      <Route path="/pending">
        {() => <ProtectedRoute component={() => (
          <OrdersView
            status="pending"
            title="Accepted Orders"
            description="Orders accepted and waiting for clothes drop-off."
          />
        )} />}
      </Route>

      <Route path="/received">
        {() => <ProtectedRoute component={() => (
          <OrdersView
            status="received"
            title="Received"
            description="Clothes received at the shop, ready for washing."
          />
        )} />}
      </Route>

      <Route path="/washing">
        {() => <ProtectedRoute component={() => (
          <OrdersView
            status="washing"
            title="Washing"
            description="Orders currently being washed."
          />
        )} />}
      </Route>

      <Route path="/drying">
        {() => <ProtectedRoute component={() => (
          <OrdersView
            status="drying"
            title="Drying"
            description="Orders currently being dried."
          />
        )} />}
      </Route>

      <Route path="/folding">
        {() => <ProtectedRoute component={() => (
          <OrdersView
            status="folding"
            title="Folding"
            description="Orders being folded and packed."
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
            title="Completed Orders"
            description="Completed and collected orders."
          />
        )} />}
      </Route>

      <Route path="/manage-staff">
        {() => <OwnerRoute component={ManageStaff} />}
      </Route>

      <Route path="/manage-services">
        {() => <OwnerRoute component={ManageServices} />}
      </Route>

      <Route path="/reports">
        {() => <OwnerRoute component={Reports} />}
      </Route>

      <Route path="/deleted">
        {() => <OwnerRoute component={RecentlyDeleted} />}
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
