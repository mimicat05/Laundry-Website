import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Star, CheckCheck, Mail, MailOpen } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Feedback } from "@shared/schema";
import { format } from "date-fns";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function InboxPage() {
  const [tab, setTab] = useState("messages");

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: feedbackList = [], isLoading: loadingFeedback } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/messages/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/messages/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const avgRating =
    feedbackList.length > 0
      ? feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length
      : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
            <p className="text-muted-foreground mt-1">Customer messages and feedback</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{messages.length}</p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {feedbackList.length > 0 ? avgRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating ({feedbackList.length})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="messages" data-testid="tab-messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-4 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="feedback" data-testid="tab-feedback" className="gap-2">
                <Star className="w-4 h-4" />
                Feedback
                {feedbackList.length > 0 && (
                  <span className="text-xs text-muted-foreground">({feedbackList.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
            {tab === "messages" && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Messages tab */}
          <TabsContent value="messages" className="mt-4 space-y-3">
            {loadingMessages ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4 h-20" />
                  </Card>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <Card>
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-3">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => (
                <Card
                  key={msg.id}
                  data-testid={`card-message-${msg.id}`}
                  className={`transition-all ${!msg.isRead ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        {msg.isRead ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm" data-testid={`text-sender-${msg.id}`}>
                            {msg.customerName}
                          </span>
                          {!msg.isRead && (
                            <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0 h-4 rounded-full">New</Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(msg.createdAt), "MMM d, yyyy · h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5">{msg.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{msg.message}</p>
                        {!msg.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markRead.mutate(msg.id)}
                            disabled={markRead.isPending}
                            data-testid={`button-mark-read-${msg.id}`}
                          >
                            <MailOpen className="w-3.5 h-3.5 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Feedback tab */}
          <TabsContent value="feedback" className="mt-4 space-y-3">
            {loadingFeedback ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4 h-20" />
                  </Card>
                ))}
              </div>
            ) : feedbackList.length === 0 ? (
              <Card>
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-3">
                  <Star className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No feedback yet</p>
                </CardContent>
              </Card>
            ) : (
              feedbackList.map((fb) => (
                <Card key={fb.id} data-testid={`card-feedback-${fb.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm" data-testid={`text-reviewer-${fb.id}`}>
                            {fb.customerName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Order #{fb.orderId}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(fb.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={fb.rating} />
                        </div>
                        {fb.comment && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">"{fb.comment}"</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
