import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Star, CheckCheck, Mail, MailOpen, Send, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Feedback, MessageReply } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

function MessageCard({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const { data: replies = [], isLoading: loadingReplies } = useQuery<MessageReply[]>({
    queryKey: ["/api/messages", msg.id, "replies"],
    queryFn: () => fetch(`/api/messages/${msg.id}/replies`).then((r) => r.json()),
    enabled: expanded,
    refetchInterval: expanded ? 4000 : false,
  });

  const markRead = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/messages/${msg.id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const sendReply = useMutation({
    mutationFn: (reply: string) =>
      apiRequest("POST", `/api/messages/${msg.id}/reply`, { reply }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", msg.id, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setReplyText("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    },
  });

  const handleExpand = () => {
    if (!expanded && !msg.isRead) markRead.mutate();
    setExpanded((v) => !v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (replyText.trim()) sendReply.mutate(replyText);
    }
  };

  return (
    <Card
      data-testid={`card-message-${msg.id}`}
      className={`transition-all ${!msg.isRead ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
    >
      {/* Header row – click to expand/collapse */}
      <button
        className="w-full text-left px-4 pt-4 pb-3"
        onClick={handleExpand}
        data-testid={`button-expand-message-${msg.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
            {!expanded && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{msg.message}</p>
            )}
          </div>
        </div>
      </button>

      {/* Thread view */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {/* Original message bubble (customer) */}
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">{msg.customerName}</p>
              <p className="text-sm text-foreground leading-relaxed">{msg.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(msg.createdAt), "MMM d · h:mm a")}</p>
            </div>
          </div>

          {/* Reply bubbles */}
          {loadingReplies ? (
            <div className="flex justify-center py-2">
              <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className={`flex ${r.senderType === "staff" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${r.senderType === "staff" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                  <p className={`text-[11px] font-semibold mb-1 ${r.senderType === "staff" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {r.senderName}
                  </p>
                  <p className="text-sm leading-relaxed">{r.body}</p>
                  <p className={`text-[10px] mt-1 ${r.senderType === "staff" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {format(new Date(r.createdAt), "MMM d · h:mm a")}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Reply input */}
          <div className="flex gap-2 pt-1">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
              className="text-sm min-h-[60px] resize-none"
              data-testid={`input-reply-${msg.id}`}
            />
            <Button
              size="sm"
              className="self-end h-9 px-3"
              onClick={() => sendReply.mutate(replyText)}
              disabled={sendReply.isPending || !replyText.trim()}
              data-testid={`button-send-reply-${msg.id}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/feedback/${fb.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/feedback"] });
      toast({ title: "Feedback deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete feedback", variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-feedback-${fb.id}`}>
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

            {confirming ? (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Delete this feedback?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-confirm-delete-feedback-${fb.id}`}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
                onClick={() => setConfirming(true)}
                data-testid={`button-delete-feedback-${fb.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
            
          </div>
        </div>

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
              messages.map((msg) => <MessageCard key={msg.id} msg={msg} />)
            )}
          </TabsContent>

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
              feedbackList.map((fb) => <FeedbackCard key={fb.id} fb={fb} />)
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
