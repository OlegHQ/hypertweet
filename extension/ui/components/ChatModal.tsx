import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Markdown } from './Markdown';
import { Select } from './Select';
import { streamChatProxy, api } from '../../apiProxy';
import { useToast } from '../hooks/useToast';
import { useModels } from '../hooks/useModels';
import { useProfile } from '../hooks/useProfile';
import type { Page } from '../../models';
import type { ChatStreamEvent, ProfileRes } from '../../api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  readPage: () => Promise<Page>;
  insertText: (text: string) => void;
  isReddit: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatModal({
  isOpen,
  onClose,
  readPage,
  insertText,
  isReddit,
  messages,
  setMessages,
}: ChatModalProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pageContext, setPageContext] = useState<Page | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const disconnectRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Model selection
  const { data: modelsData } = useModels(isOpen);
  const { data: profile } = useProfile(isOpen);

  const updateModelMutation = useMutation({
    mutationFn: (chatModel: string) =>
      api.updateProfile({ chatModel: chatModel }),
    onMutate: async chatModel => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      const previous = queryClient.getQueryData<ProfileRes>(['profile']);
      if (previous) {
        queryClient.setQueryData<ProfileRes>(['profile'], {
          ...previous,
          chatModel: chatModel,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const modelOptions =
    modelsData?.allModels.map(m => ({
      value: m.modelName,
      label: m.modelName.split('/').pop()?.replace(':free', '') ?? m.modelName,
    })) ?? [];

  const currentModel =
    profile?.chatModel ?? profile?.modelName ?? modelOptions[0]?.value ?? '';

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    updateModelMutation.mutate(e.target.value);
  };

  // Load page context on open
  useEffect(() => {
    if (isOpen) {
      void readPage().then(setPageContext);
    }
  }, [isOpen, readPage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectRef.current?.();
    };
  }, []);

  const handleSend = (): void => {
    if (!input.trim() || isStreaming || !pageContext) return;

    const userMessage: Message = {
      id: window.crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    const assistantMessage: Message = {
      id: window.crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsStreaming(true);

    const chatMessages = [...messages, userMessage].map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    disconnectRef.current = streamChatProxy(
      { messages: chatMessages, pageContext: pageContext },
      (event: ChatStreamEvent) => {
        if (event.token) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + event.token }
                : m
            )
          );
        }
      },
      error => {
        toast.error(error.message);
        setIsStreaming(false);
        // Remove empty assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
      },
      () => {
        setIsStreaming(false);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleInsertReply = async (content: string): Promise<void> => {
    if (isReddit) {
      try {
        await navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Failed to copy');
      }
    } else {
      insertText(content);
      toast.success('Reply inserted');
    }
  };

  const handleNewChat = (): void => {
    disconnectRef.current?.();
    setMessages([]);
    setIsStreaming(false);
    setInput('');
  };

  const handleClose = (): void => {
    disconnectRef.current?.();
    setIsStreaming(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="chat">
      <div className="ht-chat-container">
        <div className="ht-chat-header">
          <h2 className="ht-chat-title">Chat</h2>
          {modelOptions.length > 0 && (
            <div className="ht-chat-model-selector">
              <Select
                options={modelOptions}
                value={currentModel}
                onChange={handleModelChange}
                disabled={isStreaming || updateModelMutation.isPending}
              />
            </div>
          )}
          <div className="ht-chat-actions">
            <button
              className="ht-icon-btn"
              title="New chat"
              onClick={handleNewChat}
              disabled={isStreaming}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button className="ht-icon-btn" title="Close" onClick={handleClose}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="ht-chat-empty">
            Start a conversation to get help crafting your reply
          </div>
        ) : (
          <div className="ht-chat-messages">
            {messages.map(message => (
              <div
                key={message.id}
                className={`ht-chat-message ht-chat-message-${message.role}`}
              >
                <div className="ht-chat-message-header">
                  <span className="ht-chat-message-role">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {message.content && (
                    <button
                      className="ht-icon-btn ht-chat-message-copy"
                      title="Copy"
                      onClick={() => void handleCopy(message.content)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="ht-chat-message-content">
                  {message.content ? (
                    <Markdown
                      onInsertReply={text => void handleInsertReply(text)}
                      isReddit={isReddit}
                    >
                      {message.content}
                    </Markdown>
                  ) : isStreaming && message.role === 'assistant' ? (
                    <span className="ht-chat-streaming">
                      <span className="ht-chat-streaming-dot" />
                      Thinking...
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="ht-chat-input-area">
          <textarea
            ref={textareaRef}
            className="ht-chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
          />
          <button
            className="ht-chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !pageContext}
            title="Send"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </Modal>
  );
}
