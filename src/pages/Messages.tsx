
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Search, MoreVertical, Phone, Video, Star, Paperclip, UserPlus, Shield, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ConnectionRequest from '@/components/ConnectionRequest';
import PendingRequests from '@/components/PendingRequests';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'comedian' | 'promoter';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  isOnline: boolean;
}

interface ConnectionRequestData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'comedian' | 'promoter';
  message: string;
  timestamp: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    participantId: '2',
    participantName: 'Sarah Johnson',
    participantAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    participantRole: 'comedian',
    lastMessage: 'Thanks for accepting my application! Looking forward to the show.',
    lastMessageTime: '2 hours ago',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: '1',
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
        content: 'Hi! I just applied for your Wednesday Comedy Night. I have great crowd work skills and clean material.',
        timestamp: '10:30 AM',
        isRead: true,
      },
      {
        id: '2',
        senderId: '1',
        senderName: 'You',
        senderAvatar: '',
        content: 'Great! I checked out your videos and I think you\'d be perfect for the show. Application accepted!',
        timestamp: '10:45 AM',
        isRead: true,
      },
      {
        id: '3',
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
        content: 'Thanks for accepting my application! Looking forward to the show.',
        timestamp: '11:15 AM',
        isRead: false,
      },
      {
        id: '4',
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
        content: 'Quick question - is there a green room where we can prepare?',
        timestamp: '11:20 AM',
        isRead: false,
      },
    ]
  },
  {
    id: '2',
    participantId: '3',
    participantName: 'Comedy Central Venues',
    participantAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
    participantRole: 'promoter',
    lastMessage: 'We have an opening for next Friday if you\'re interested.',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '1',
        senderId: '3',
        senderName: 'Comedy Central Venues',
        senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
        content: 'Hi Alex! We loved your set last week. We have an opening for next Friday if you\'re interested.',
        timestamp: 'Yesterday 3:20 PM',
        isRead: true,
      },
      {
        id: '2',
        senderId: '1',
        senderName: 'You',
        senderAvatar: '',
        content: 'That sounds great! What time and what\'s the set length?',
        timestamp: 'Yesterday 3:45 PM',
        isRead: true,
      },
    ]
  },
  {
    id: '3',
    participantId: '4',
    participantName: 'Mike Chen',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    participantRole: 'comedian',
    lastMessage: 'Hey, any tips for dealing with hecklers?',
    lastMessageTime: '3 days ago',
    unreadCount: 1,
    isOnline: true,
    messages: [
      {
        id: '1',
        senderId: '4',
        senderName: 'Mike Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        content: 'Hey Alex! I saw you handle that heckler perfectly last week. Any tips for dealing with difficult audience members?',
        timestamp: '3 days ago',
        isRead: false,
      },
    ]
  },
];

const mockPendingRequests: ConnectionRequestData[] = [
  {
    id: '1',
    senderId: '5',
    senderName: 'Jessica Martinez',
    senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    senderRole: 'comedian',
    message: 'Hi! I\'m a stand-up comedian with 3 years of experience. I\'d love to connect and discuss potential performance opportunities at your venues.',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    senderId: '6',
    senderName: 'David Park',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    senderRole: 'comedian',
    message: 'Hello! I specialize in crowd work and clean comedy. I saw your recent event posts and would be interested in connecting.',
    timestamp: '1 day ago'
  }
];

const Messages = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'comedian' | 'promoter'>('all');
  const [showConnectionRequest, setShowConnectionRequest] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(mockPendingRequests);
  const [selectedTab, setSelectedTab] = useState('conversations');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || conv.participantRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: 'You',
      senderAvatar: profile?.avatar_url || '',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, message],
          lastMessage: message.content,
          lastMessageTime: 'Just now',
        };
      }
      return conv;
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastMessage: message.content,
      lastMessageTime: 'Just now',
    } : null);

    setNewMessage('');
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ ...msg, isRead: true }))
        };
      }
      return conv;
    }));
  };

  const handleSendConnectionRequest = (introMessage: string) => {
    setShowConnectionRequest(false);
    // In a real app, this would send the request to the backend
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (request) {
      // Create new conversation
      const newConversation: Conversation = {
        id: Date.now().toString(),
        participantId: request.senderId,
        participantName: request.senderName,
        participantAvatar: request.senderAvatar,
        participantRole: request.senderRole,
        lastMessage: request.message,
        lastMessageTime: 'Just now',
        unreadCount: 1,
        isOnline: true,
        messages: [{
          id: '1',
          senderId: request.senderId,
          senderName: request.senderName,
          senderAvatar: request.senderAvatar,
          content: request.message,
          timestamp: 'Just now',
          isRead: false
        }]
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setSelectedConversation(newConversation);
      setSelectedTab('conversations');
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleBlockUser = (userId: string) => {
    setPendingRequests(prev => prev.filter(r => r.senderId !== userId));
    setConversations(prev => prev.filter(c => c.participantId !== userId));
    // In a real app, this would also add the user to a blocked list
  };

  const handleReportUser = (userId: string) => {
    // In a real app, this would send a report to moderation
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view messages</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-slate-300">Communicate with comedians and promoters</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm mb-6">
            <TabsTrigger value="conversations" className="data-[state=active]:bg-primary">
              Conversations ({conversations.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary">
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="connect" className="data-[state=active]:bg-primary">
              Connect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search conversations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <Select value={roleFilter} onValueChange={(value: 'all' | 'comedian' | 'promoter') => setRoleFilter(value)}>
                            <SelectTrigger className="w-10 h-8 p-0 border-none bg-transparent hover:bg-white/10 transition-colors">
                              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="all" className="text-white hover:bg-gray-700">All</SelectItem>
                              <SelectItem value="comedian" className="text-white hover:bg-gray-700">Comedians</SelectItem>
                              <SelectItem value="promoter" className="text-white hover:bg-gray-700">Promoters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => {
                            setSelectedConversation(conversation);
                            markAsRead(conversation.id);
                          }}
                          className={`p-4 cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10 ${
                            selectedConversation?.id === conversation.id ? 'bg-white/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={conversation.participantAvatar} alt={conversation.participantName} />
                                <AvatarFallback>{conversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              {conversation.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium truncate">{conversation.participantName}</h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      conversation.participantRole === 'comedian' 
                                        ? 'text-blue-300 border-blue-300' 
                                        : 'text-orange-300 border-orange-300'
                                    }`}
                                  >
                                    {conversation.participantRole}
                                  </Badge>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-xs min-w-[20px] h-5 flex items-center justify-center">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-300 truncate mt-1">{conversation.lastMessage}</p>
                              <p className="text-xs text-slate-400 mt-1">{conversation.lastMessageTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full flex flex-col">
                    {/* Chat Header */}
                    <CardHeader className="border-b border-white/10 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} />
                              <AvatarFallback>{selectedConversation.participantName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            {selectedConversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <h2 className="font-semibold">{selectedConversation.participantName}</h2>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  selectedConversation.participantRole === 'comedian' 
                                    ? 'text-blue-300 border-blue-300' 
                                    : 'text-orange-300 border-orange-300'
                                }`}
                              >
                                {selectedConversation.participantRole}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {selectedConversation.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
                            <Video className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleBlockUser(selectedConversation.participantId)}
                            className="text-red-300 border-red-300 hover:bg-red-500/20"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReportUser(selectedConversation.participantId)}
                            className="text-orange-300 border-orange-300 hover:bg-orange-500/20"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex space-x-2 max-w-[80%] ${message.senderId === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarImage 
                                src={message.senderId === user.id ? (profile?.avatar_url || '') : message.senderAvatar} 
                                alt={message.senderName} 
                              />
                              <AvatarFallback className="text-xs">
                                {message.senderName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg p-3 ${
                              message.senderId === user.id 
                                ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                                : 'bg-white/20 text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user.id ? 'text-slate-100' : 'text-slate-300'
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t border-white/10 p-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), sendMessage())}
                        />
                        <Button 
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full flex items-center justify-center">
                    <CardContent className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                      <p className="text-slate-300">Choose a conversation from the list to start messaging</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <PendingRequests
              requests={pendingRequests}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onBlockUser={handleBlockUser}
            />
          </TabsContent>

          <TabsContent value="connect">
            {showConnectionRequest ? (
              <ConnectionRequest
                recipientId="example"
                recipientName="Example User"
                recipientAvatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                recipientRole="promoter"
                onSendRequest={handleSendConnectionRequest}
                onCancel={() => setShowConnectionRequest(false)}
              />
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold mb-2">Connect with New People</h3>
                  <p className="text-slate-300 mb-6">
                    Find comedians and promoters to collaborate with. Send connection requests to start messaging.
                  </p>
                  <Button 
                    onClick={() => setShowConnectionRequest(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find People to Connect
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Messages;
