// src/app/page.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, AuditResult } from "@/types/aso-types";

export default function Home() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string>();
    const [currentAppData, setCurrentAppData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setCurrentAppData(null);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    conversationId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send message");
            }

            setConversationId(data.conversationId);

            let assistantContent = "";
            let assistantAuditResult: AuditResult | undefined = undefined;

            // Handle different response types
            switch (data.type) {
                case "confirmation":
                    setCurrentAppData(data.appData);
                    assistantContent = data.message;
                    break;

                case "audit_complete":
                    assistantAuditResult = data.auditResult;
                    const scoreEmoji =
                        data.auditResult.overallScore >= 80
                            ? "🌟"
                            : data.auditResult.overallScore >= 60
                              ? "📈"
                              : "🚀";
                    assistantContent = `📊 ASO Audit Complete!\n\nOverall Score: ${data.auditResult.overallScore}/100 ${scoreEmoji}\n\nThe detailed results are shown below.`;
                    break;

                case "error":
                    assistantContent = data.message;
                    break;

                default:
                    assistantContent = data.message;
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: assistantContent,
                timestamp: new Date(),
                auditResult: assistantAuditResult,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "⚠️ Sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle confirmation button clicks
    const handleConfirmation = (response: "yes" | "no") => {
        // Set the input value
        setInput(response);

        // Small delay to ensure state updates, then submit
        setTimeout(() => {
            const form = document.querySelector("form");
            if (form) {
                form.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                );
            }
        }, 50);
    };

    const renderConfirmationCard = (appData: any) => {
        if (!appData) return null;

        return (
            <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4">
                    {appData.icon && (
                        <img
                            src={appData.icon}
                            alt={appData.name}
                            className="w-16 h-16 rounded-xl shadow-sm"
                        />
                    )}
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                            {appData.name}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <div>👨‍💻 {appData.developer}</div>
                            <div>📂 {appData.category}</div>
                            <div>🌍 {appData.country}</div>
                            <div>
                                ⭐ {appData.rating.toFixed(1)}/5 (
                                {appData.reviewCount.toLocaleString()} reviews)
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                    <p className="font-medium">
                        Is this the app you meant to audit?
                    </p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => handleConfirmation("yes")}
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            Yes, proceed →
                        </button>
                        <button
                            onClick={() => handleConfirmation("no")}
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            No, try again
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAuditScore = (result: AuditResult) => {
        const getScoreColor = (score: number) => {
            if (score >= 80) return "text-emerald-600";
            if (score >= 60) return "text-amber-600";
            return "text-rose-600";
        };

        const getScoreBg = (score: number) => {
            if (score >= 80) return "bg-emerald-500";
            if (score >= 60) return "bg-amber-500";
            return "bg-rose-500";
        };

        const getScoreEmoji = (score: number) => {
            if (score >= 80) return "🌟";
            if (score >= 60) return "📈";
            return "🚀";
        };

        const getScoreLabel = (score: number) => {
            if (score >= 80) return "Excellent";
            if (score >= 60) return "Good";
            return "Needs Improvement";
        };

        return (
            <div className="mt-4 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                {/* Overall Score */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="text-center">
                        <div
                            className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}
                        >
                            {result.overallScore}
                        </div>
                        <div className="text-xs text-gray-500">/100</div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                                {getScoreLabel(result.overallScore)}
                            </span>
                            <span className="text-gray-500">
                                {getScoreEmoji(result.overallScore)}
                            </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full transition-all duration-1000 ${getScoreBg(result.overallScore)}`}
                                style={{ width: `${result.overallScore}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Dimension Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.dimensions.map((dim, idx) => {
                        const percentage = (dim.score / 10) * 100;
                        const isHigh = percentage >= 70;
                        const isMedium = percentage >= 40;
                        const barColor = isHigh
                            ? "bg-emerald-500"
                            : isMedium
                              ? "bg-amber-500"
                              : "bg-rose-500";

                        return (
                            <div
                                key={idx}
                                className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-xs text-gray-700 truncate">
                                        {dim.name}
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${getScoreColor(dim.score)}`}
                                    >
                                        {dim.score}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-700 ${barColor}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                {dim.checks?.slice(0, 1).map((check, i) => (
                                    <div
                                        key={i}
                                        className="mt-1 text-[10px] text-gray-500 truncate"
                                    >
                                        {check}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Quick Wins & Recommendations */}
                {(result.quickWins.length > 0 ||
                    result.highImpactChanges.length > 0) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {result.quickWins.length > 0 && (
                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                <h4 className="font-semibold text-emerald-700 text-sm flex items-center gap-1">
                                    ⚡ Quick Wins
                                    <span className="text-xs font-normal text-emerald-500 ml-1">
                                        (high impact, low effort)
                                    </span>
                                </h4>
                                {result.quickWins
                                    .slice(0, 3)
                                    .map((item, idx) => (
                                        <div key={idx} className="mt-2 text-sm">
                                            <div className="font-medium text-gray-800">
                                                {item.title}
                                            </div>
                                            {item.beforeExample &&
                                                item.afterExample && (
                                                    <div className="mt-1 text-xs bg-white rounded p-1.5 border border-emerald-100">
                                                        <span className="line-through text-red-500">
                                                            {item.beforeExample}
                                                        </span>
                                                        <span className="text-emerald-600 ml-1">
                                                            →{" "}
                                                            {item.afterExample}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                            </div>
                        )}

                        {result.highImpactChanges.length > 0 && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <h4 className="font-semibold text-amber-700 text-sm flex items-center gap-1">
                                    💪 High-Impact
                                    <span className="text-xs font-normal text-amber-500 ml-1">
                                        (requires more effort)
                                    </span>
                                </h4>
                                {result.highImpactChanges
                                    .slice(0, 3)
                                    .map((item, idx) => (
                                        <div key={idx} className="mt-2 text-sm">
                                            <div className="font-medium text-gray-800">
                                                {item.title}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-0.5">
                                                {item.evidence}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 py-4 shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                            <span>📱</span> ASO Audit Agent
                        </h1>
                        <p className="text-sm text-gray-500">
                            Paste an App Store URL for a comprehensive ASO audit
                        </p>
                    </div>
                </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-[60vh]">
                            <div className="text-center max-w-md">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                                    Start Your ASO Audit
                                </h2>
                                <p className="text-gray-500 mb-4">
                                    Paste any Apple App Store URL to get a
                                    comprehensive optimization audit with
                                    actionable recommendations.
                                </p>
                                <div className="bg-gray-100 rounded-lg p-3 text-left text-sm text-gray-600 font-mono">
                                    https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Try it with any App Store URL
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 ${
                                        message.role === "user"
                                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
                                            : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                                    }`}
                                >
                                    <div
                                        className={`whitespace-pre-wrap text-sm leading-relaxed ${message.role === "user" ? "text-white" : ""}`}
                                    >
                                        {message.content}
                                    </div>

                                    {/* Render confirmation card if we have app data and this is the latest message */}
                                    {message.role === "assistant" &&
                                        currentAppData &&
                                        message.id ===
                                            messages[messages.length - 1]?.id &&
                                        renderConfirmationCard(currentAppData)}

                                    {/* Render audit results if present */}
                                    {message.auditResult &&
                                        renderAuditScore(message.auditResult)}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: "0s" }}
                                    />
                                    <div
                                        className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                    />
                                    <div
                                        className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.4s" }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSubmit}
                className="border-t border-gray-200/80 bg-white/80 backdrop-blur-sm p-4"
            >
                <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste an App Store URL or ask a question..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50/50 transition-shadow"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        {isLoading ? "Thinking..." : "Send"}
                    </button>
                </div>
            </form>
        </div>
    );
}
