import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Eye, Lock, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/lib/websocket";

interface ChatMessageProps {
  message: ChatMessage;
  isOwn: boolean;
  onImageView?: (messageId: string) => void;
}

export function ChatMessage({ message, isOwn, onImageView }: ChatMessageProps) {
  const [isViewed, setIsViewed] = useState(message.hasBeenViewed);
  
  const handleImageClick = () => {
    if (message.messageType === 'image' && !isViewed && onImageView) {
      onImageView(message.id);
      setIsViewed(true);
    }
  };
  
  const getInitials = (nickname: string) => {
    return nickname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  
  if (message.isViewOnce && isViewed) {
    return (
      <div className={cn(
        "flex w-full mb-4 px-4 sm:px-6",
        isOwn ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "flex max-w-[85%] sm:max-w-[70%]",
          isOwn ? "flex-row-reverse items-end space-x-reverse space-x-2" : "items-end space-x-2"
        )}>
          {/* Avatar */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1",
            isOwn 
              ? "bg-blue-500 text-white" 
              : "bg-gray-500 text-white"
          )}>
            <span className="text-xs font-medium">
              {getInitials(message.senderNickname)}
            </span>
          </div>

          {/* Message Content */}
          <div className="space-y-1 flex-1">
            <div className={cn(
              "rounded-2xl px-4 py-2 break-words",
              isOwn 
                ? "bg-blue-500/30 text-gray-600 dark:text-gray-400 rounded-br-md" 
                : "bg-gray-200/30 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 rounded-bl-md"
            )}>
              <p className="text-sm italic">
                This message has been viewed and deleted
              </p>
            </div>
            
            {/* Message Info */}
            <div className={cn(
              "flex items-center space-x-2 text-xs text-muted-foreground px-2",
              isOwn ? "justify-end" : "justify-start"
            )}>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex w-full mb-4 px-4 sm:px-6",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[85%] sm:max-w-[70%]",
        isOwn ? "flex-row-reverse items-end space-x-reverse space-x-2" : "items-end space-x-2"
      )}>
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1",
          isOwn 
            ? "bg-blue-500 text-white" 
            : "bg-gray-500 text-white"
        )}>
          <span className="text-xs font-medium">
            {getInitials(message.senderNickname)}
          </span>
        </div>

        {/* Message Content */}
        <div className="space-y-1 flex-1">
          <div 
            className={cn(
              "rounded-2xl px-4 py-2 break-words",
              isOwn 
                ? "bg-blue-500 text-white rounded-br-md" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md",
              message.messageType === 'image' && "cursor-pointer hover:opacity-80 transition-opacity p-2"
            )}
            onClick={message.messageType === 'image' ? handleImageClick : undefined}
          >
            {message.messageType === 'text' ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <div className="relative">
                {message.isViewOnce && !isViewed ? (
                  <div className="w-48 h-32 bg-muted rounded flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Eye className="w-5 h-5 text-warning" />
                      </div>
                      <p className="text-xs font-medium">Tap to view</p>
                      <p className="text-xs text-muted-foreground">Disappears after viewing</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={message.content} 
                    alt="Shared image" 
                    className="max-w-48 max-h-32 object-cover rounded"
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Message Info */}
          <div className={cn(
            "flex items-center space-x-2 text-xs text-muted-foreground px-2",
            isOwn ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"
          )}>
            <span>{timeAgo}</span>
            <div className="flex items-center space-x-1">
              <Lock className="w-3 h-3 text-green-500" />
              <span>Encrypted</span>
            </div>
            {message.isViewOnce && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>View once</span>
              </div>
            )}
            {isOwn && (
              <CheckCheck className="w-3 h-3 text-green-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
