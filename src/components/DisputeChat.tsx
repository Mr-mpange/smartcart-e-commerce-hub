import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, MessageSquare, Shield } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  order_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_name?: string;
}

interface DisputeChatProps {
  orderId: string;
  canSend?: boolean;
}

export function DisputeChat({ orderId, canSend = true }: DisputeChatProps) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`dispute-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_messages",
          filter: `order_id=eq.${orderId}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.user_id)
            .single();
          setMessages((prev) => [
            ...prev,
            { ...msg, sender_name: profile?.full_name || "Unknown" },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("dispute_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
      let namesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        namesMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      }

      setMessages(
        (data || []).map((m: any) => ({
          ...m,
          sender_name: namesMap.get(m.user_id) || "Unknown",
        }))
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("dispute_messages").insert({
        order_id: orderId,
        user_id: user.id,
        message: newMessage.trim(),
        is_admin: userRole === "admin",
      });

      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Dispute Discussion</span>
        <span className="text-xs text-muted-foreground">({messages.length} messages)</span>
      </div>

      <div ref={scrollRef} className="h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className={`text-xs ${msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.is_admin ? <Shield className="h-3 w-3" /> : msg.sender_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] space-y-0.5`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] text-muted-foreground ${isMe ? "justify-end" : ""}`}>
                    <span>{msg.is_admin ? "Admin" : msg.sender_name}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canSend && (
        <div className="p-3 border-t flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[40px] max-h-[80px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
