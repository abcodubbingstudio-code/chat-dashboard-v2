"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

type Message = {
  id: number;
  created_at: string;
  contact_phone: string;
  contact_name: string;
  message: string;
  direction: string;
};

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Message[]>([]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ROYAL" },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("ROYAL")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const rows = (data || []) as Message[];
    setMessages(rows);

    const uniqueContacts = Array.from(
      new Map(rows.map((item) => [item.contact_phone, item])).values()
    );

    setContacts(uniqueContacts);
  };

  const filteredMessages = messages.filter(
    (msg) => msg.contact_phone === selectedUser
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      
      {/* LEFT SIDE */}
      <div style={{ width: "30%", borderRight: "1px solid #ccc", padding: 10 }}>
        <h3>Chats</h3>

        {contacts.map((c) => (
          <div
            key={c.contact_phone}
            onClick={() => setSelectedUser(c.contact_phone)}
            style={{
              padding: 10,
              cursor: "pointer",
              background: selectedUser === c.contact_phone ? "#eee" : "white",
            }}
          >
            {c.contact_name || c.contact_phone}
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div style={{ width: "70%", padding: 20 }}>
        <h3>Chat</h3>

        {filteredMessages.length === 0 && (
          <p>Select a chat to start</p>
        )}

        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.direction === "outgoing" ? "right" : "left",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: 10,
                borderRadius: 10,
                background: msg.direction === "outgoing" ? "#DCF8C6" : "#eee",
              }}
            >
              {msg.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}