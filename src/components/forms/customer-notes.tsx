'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Plus, 
  X, 
  Save, 
  Tag,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export interface CustomerNote {
  id: string;
  content: string;
  type: 'note' | 'call' | 'meeting' | 'email' | 'order';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerTag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface CustomerNotesProps {
  notes: CustomerNote[];
  tags: CustomerTag[];
  onSaveNotes: (notes: CustomerNote[]) => Promise<void>;
  onSaveTags: (tags: CustomerTag[]) => Promise<void>;
  currentUserId: string;
  currentUserName: string;
  isLoading?: boolean;
}

const noteTypeConfig = {
  note: { label: '一般備註', icon: FileText, color: 'bg-gray-100 text-gray-800' },
  call: { label: '電話紀錄', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
  meeting: { label: '會議紀錄', icon: Calendar, color: 'bg-green-100 text-green-800' },
  email: { label: '郵件紀錄', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  order: { label: '訂單相關', icon: FileText, color: 'bg-orange-100 text-orange-800' }
};

const tagColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e'
];

export function CustomerNotes({ 
  notes, 
  tags, 
  onSaveNotes, 
  onSaveTags, 
  currentUserId,
  currentUserName,
  isLoading = false 
}: CustomerNotesProps) {
  const [editingNotes, setEditingNotes] = useState<CustomerNote[]>(notes);
  const [editingTags, setEditingTags] = useState<CustomerTag[]>(tags);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'note' as CustomerNote['type']
  });
  const [newTag, setNewTag] = useState({
    name: '',
    color: tagColors[0]
  });

  useEffect(() => {
    setEditingNotes(notes);
  }, [notes]);

  useEffect(() => {
    setEditingTags(tags);
  }, [tags]);

  const handleAddNote = () => {
    if (!newNote.content.trim()) return;

    const note: CustomerNote = {
      id: Date.now().toString(),
      content: newNote.content,
      type: newNote.type,
      createdBy: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedNotes = [note, ...editingNotes];
    setEditingNotes(updatedNotes);
    setNewNote({ content: '', type: 'note' });
    setIsAddingNote(false);
  };

  const handleRemoveNote = (noteId: string) => {
    const updatedNotes = editingNotes.filter(note => note.id !== noteId);
    setEditingNotes(updatedNotes);
  };

  const handleAddTag = () => {
    if (!newTag.name.trim()) return;
    
    // 檢查標籤是否已存在
    if (editingTags.some(tag => tag.name.toLowerCase() === newTag.name.toLowerCase())) {
      return;
    }

    const tag: CustomerTag = {
      id: Date.now().toString(),
      name: newTag.name,
      color: newTag.color,
      createdAt: new Date()
    };

    const updatedTags = [...editingTags, tag];
    setEditingTags(updatedTags);
    setNewTag({ name: '', color: tagColors[0] });
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedTags = editingTags.filter(tag => tag.id !== tagId);
    setEditingTags(updatedTags);
  };

  const handleSaveNotes = async () => {
    await onSaveNotes(editingNotes);
  };

  const handleSaveTags = async () => {
    await onSaveTags(editingTags);
  };

  return (
    <div className="space-y-6">
      {/* 客戶標籤 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Tag className="h-5 w-5" />
            <h3 className="text-lg font-semibold">客戶標籤</h3>
          </div>
          <div className="flex items-center space-x-2">
            {!isAddingTag && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTag(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                新增標籤
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTags}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              儲存標籤
            </Button>
          </div>
        </div>

        {/* 新增標籤表單 */}
        {isAddingTag && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Input
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入標籤名稱"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              
              <select
                value={newTag.color}
                onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                {tagColors.map((color) => (
                  <option key={color} value={color} style={{ backgroundColor: color }}>
                    {color}
                  </option>
                ))}
              </select>
              
              <Button onClick={handleAddTag} size="sm">
                新增
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsAddingTag(false);
                  setNewTag({ name: '', color: tagColors[0] });
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 標籤列表 */}
        <div className="flex flex-wrap gap-2">
          {editingTags.length > 0 ? (
            editingTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-2 text-current hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-muted-foreground">尚未設定標籤</p>
          )}
        </div>
      </Card>

      {/* 客戶備忘錄 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">備忘錄</h3>
          </div>
          <div className="flex items-center space-x-2">
            {!isAddingNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNote(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                新增備忘
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              儲存備忘錄
            </Button>
          </div>
        </div>

        {/* 新增備忘錄表單 */}
        {isAddingNote && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value as CustomerNote['type'] }))}
                  className="px-3 py-2 border border-input rounded-md text-sm"
                >
                  {Object.entries(noteTypeConfig).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="輸入備忘錄內容..."
                className="w-full p-3 border border-input rounded-md resize-none"
                rows={3}
              />
              
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote({ content: '', type: 'note' });
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleAddNote} size="sm">
                  新增備忘錄
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 備忘錄列表 */}
        <div className="space-y-4">
          {editingNotes.length > 0 ? (
            editingNotes.map((note) => {
              const typeConfig = noteTypeConfig[note.type];
              const TypeIcon = typeConfig.icon;
              
              return (
                <div key={note.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNote(note.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{currentUserName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(note.createdAt, 'yyyy/MM/dd HH:mm', { locale: zhTW })}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-8">
              尚無備忘錄
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}