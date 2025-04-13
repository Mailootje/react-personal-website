import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import Split from 'react-split';
import { 
  FaFolder, FaFile, FaFolderOpen, FaChevronDown, FaChevronRight, FaPlus, 
  FaUpload, FaSave, FaTrash, FaTimes, FaSearch, FaExchangeAlt, FaCode, 
  FaMinus, FaPlus as FaPlusIcon, FaList, FaMap, FaPlay, FaInfoCircle,
  FaKeyboard, FaClock, FaCheck, FaSun, FaMoon, FaCut, FaCopy, FaPaste,
  FaEdit, FaRedo, FaUndo, FaFileExport, FaDownload, FaPen, FaFileImport
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoBackground } from '@/components/VideoBackground';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import classNames from 'classnames';
import JSZip from 'jszip';

// Types
interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  parent: string | null;
  children?: string[];
  isOpen?: boolean;
}

interface FileSystemState {
  items: Record<string, FileSystemItem>;
  rootItems: string[];
}

interface EditorTab {
  id: string;
  fileId: string;
  isActive: boolean;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition;
  itemId: string | null;
}

// Language detection by file extension
const getLanguageByFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'php': 'php',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'txt': 'plaintext'
  };
  
  return languageMap[extension] || 'plaintext';
};

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

const OnlineCodeEditor: React.FC = () => {
  // Monaco instance
  const monaco = useMonaco();
  
  // State
  const [fileSystem, setFileSystem] = useState<FileSystemState>({
    items: {},
    rootItems: []
  });
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('javascript');
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemParent, setNewItemParent] = useState<string | null>(null);
  const [editorTheme, setEditorTheme] = useState<string>('vs-dark');
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    itemId: null
  });
  
  // Rename state
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [itemToRename, setItemToRename] = useState<string | null>(null);
  const [newItemRename, setNewItemRename] = useState<string>('');
  
  const [editorOptions, setEditorOptions] = useState({
    minimap: { enabled: true },
    fontSize: 14,
    wordWrap: 'on' as 'on',
    automaticLayout: true,
    lineNumbers: 'on' as 'on',
    bracketPairs: {
      colorized: true
    }
  });
  
  // State for new features
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [executeResults, setExecuteResults] = useState<string>('');
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>("");
  
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30); // seconds
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('default');
  const [savedWorkspaces, setSavedWorkspaces] = useState<string[]>([]);
  const [isWorkspaceManagerOpen, setIsWorkspaceManagerOpen] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Code snippets
  const codeSnippets = [
    // HTML snippets
    {
      name: 'HTML5 Boilerplate',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  
</body>
</html>`
    },
    {
      name: 'HTML Form Template',
      language: 'html',
      code: `<form action="#" method="POST">
  <div>
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div>
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div>
    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="4" required></textarea>
  </div>
  <button type="submit">Submit</button>
</form>`
    },
    
    // CSS snippets
    {
      name: 'CSS Flexbox Container',
      language: 'css',
      code: `.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}`
    },
    {
      name: 'CSS Grid Layout',
      language: 'css',
      code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-gap: 1rem;
}`
    },
    {
      name: 'CSS Dark Mode Variables',
      language: 'css',
      code: `:root {
  --primary-color: #3490dc;
  --secondary-color: #ffed4a;
  --text-color: #333;
  --bg-color: #fff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #90cdf4;
    --secondary-color: #f6e05e;
    --text-color: #f7fafc;
    --bg-color: #1a202c;
  }
}`
    },
    
    // JavaScript snippets
    {
      name: 'JavaScript Fetch API',
      language: 'javascript',
      code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! Status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`
    },
    {
      name: 'JavaScript Array Methods',
      language: 'javascript',
      code: `// Sample data
const items = [
  { id: 1, name: 'Item 1', price: 10, category: 'A' },
  { id: 2, name: 'Item 2', price: 20, category: 'B' },
  { id: 3, name: 'Item 3', price: 15, category: 'A' },
  { id: 4, name: 'Item 4', price: 30, category: 'C' },
];

// Filter items in category A
const categoryAItems = items.filter(item => item.category === 'A');

// Map to get just the names
const itemNames = items.map(item => item.name);

// Sort by price (ascending)
const sortedByPrice = [...items].sort((a, b) => a.price - b.price);

// Calculate total price
const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

// Find an item
const foundItem = items.find(item => item.id === 2);`
    },
    {
      name: 'React Component',
      language: 'javascript',
      code: `import React, { useState, useEffect } from 'react';

function MyComponent({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
    // Cleanup function
    return () => {
      document.title = 'React App';
    };
  }, [count]);
  
  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };
  
  return (
    <div className="my-component">
      <h1>Counter: {count}</h1>
      <button onClick={handleIncrement}>
        Increment
      </button>
    </div>
  );
}

export default MyComponent;`
    },
    
    // TypeScript snippets
    {
      name: 'TypeScript Interface',
      language: 'typescript',
      code: `interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Read-only property
}

// Function that takes a User
function formatUser(user: User): string {
  return \`\${user.name} <\${user.email}>\`;
}

// Class implementing the interface
class AdminUser implements User {
  id: number;
  name: string;
  email: string;
  readonly createdAt: Date;
  role: string = 'admin';
  
  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }
}`
    },
    
    // Node.js snippets
    {
      name: 'Node.js Express Server',
      language: 'javascript',
      code: `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Route with parameters
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ id: userId, name: 'Example User' });
});

// POST route with request body
app.post('/users', (req, res) => {
  const newUser = req.body;
  // Process new user data...
  res.status(201).json({ message: 'User created successfully', user: newUser });
});

// Start the server
app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`
    },
    
    // SQL snippet
    {
      name: 'SQL Queries',
      language: 'sql',
      code: `-- Create table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (username, email) 
VALUES ('johndoe', 'john@example.com');

-- Select with join
SELECT u.username, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.id = 1;

-- Update
UPDATE users 
SET email = 'newemail@example.com' 
WHERE id = 1;

-- Delete
DELETE FROM users 
WHERE id = 1;`
    },
    
    // Python snippet
    {
      name: 'Python Flask App',
      language: 'python',
      code: `from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample data
items = [
    {"id": 1, "name": "Item 1"},
    {"id": 2, "name": "Item 2"}
]

@app.route('/items', methods=['GET'])
def get_items():
    return jsonify(items)

@app.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    item = next((item for item in items if item['id'] == item_id), None)
    if item:
        return jsonify(item)
    return jsonify({"error": "Item not found"}), 404

@app.route('/items', methods=['POST'])
def create_item():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Name is required"}), 400
        
    new_id = max(item['id'] for item in items) + 1 if items else 1
    new_item = {"id": new_id, "name": data['name']}
    items.append(new_item)
    return jsonify(new_item), 201

if __name__ == '__main__':
    app.run(debug=True)`
    },
    
    // Markdown snippet
    {
      name: 'Markdown Template',
      language: 'markdown',
      code: `# Project Title

## Description
A brief description of your project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`javascript
import { myFunction } from './myModule';

myFunction();
\`\`\`

## Features
- Feature 1
- Feature 2
- Feature 3

## License
MIT
`
    },
    
    {
      name: 'JavaScript Promise Chain',
      language: 'javascript',
      code: `function fetchUserWithPosts(userId) {
  return fetch(\`https://api.example.com/users/\${userId}\`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Could not fetch user');
      }
      return response.json();
    })
    .then(user => {
      return fetch(\`https://api.example.com/users/\${user.id}/posts\`)
        .then(response => response.json())
        .then(posts => {
          user.posts = posts;
          return user;
        });
    })
    .catch(error => {
      console.error('Error in promise chain:', error);
      throw error;
    });
}`
    }
  ];

  // Prevent browser shortcuts and handle specific keyboard events
  const preventBrowserShortcuts = useCallback((e: KeyboardEvent) => {
    // Keys we want to prevent browser behavior for
    const editorShortcuts = [
      // Ctrl+F (Find/Search)
      { key: 'f', ctrl: true, alt: false, shift: false },
      // Ctrl+S (Save)
      { key: 's', ctrl: true, alt: false, shift: false },
      // Ctrl+P (Print)
      { key: 'p', ctrl: true, alt: false, shift: false },
      // Ctrl+G (Go to line)
      { key: 'g', ctrl: true, alt: false, shift: false },
      // Ctrl+/ (Comment)
      { key: '/', ctrl: true, alt: false, shift: false },
      // Ctrl+D (Bookmark)
      { key: 'd', ctrl: true, alt: false, shift: false },
      // Ctrl+K (Link)
      { key: 'k', ctrl: true, alt: false, shift: false },
      // Ctrl+B (Bold)
      { key: 'b', ctrl: true, alt: false, shift: false },
      // Ctrl+I (Italic)
      { key: 'i', ctrl: true, alt: false, shift: false },
      // Ctrl+W (Close tab)
      { key: 'w', ctrl: true, alt: false, shift: false },
      // Ctrl+J (Download)
      { key: 'j', ctrl: true, alt: false, shift: false },
      // Ctrl+H (History)
      { key: 'h', ctrl: true, alt: false, shift: false },
      // Ctrl+U (View Source)
      { key: 'u', ctrl: true, alt: false, shift: false },
      // Shift+Alt+F (Format)
      { key: 'f', ctrl: false, alt: true, shift: true },
      // Alt+Left/Right (Browser back/forward)
      { key: 'ArrowLeft', ctrl: false, alt: true, shift: false },
      { key: 'ArrowRight', ctrl: false, alt: true, shift: false },
      // Alt+Up/Down (Move line)
      { key: 'ArrowUp', ctrl: false, alt: true, shift: false },
      { key: 'ArrowDown', ctrl: false, alt: true, shift: false },
      // Ctrl+Shift+K (Delete line)
      { key: 'k', ctrl: true, alt: false, shift: true },
      // Ctrl+Plus/Minus (Zoom)
      { key: '+', ctrl: true, alt: false, shift: false },
      { key: '-', ctrl: true, alt: false, shift: false },
      { key: '=', ctrl: true, alt: false, shift: false }
    ];
    
    // Check if the current key combination matches any of our shortcuts
    const isEditorShortcut = editorShortcuts.some(shortcut => 
      e.key.toLowerCase() === shortcut.key.toLowerCase() &&
      e.ctrlKey === shortcut.ctrl &&
      e.altKey === shortcut.alt &&
      e.shiftKey === shortcut.shift
    );
    
    // If it's one of our editor shortcuts, prevent the browser from handling it
    if (isEditorShortcut) {
      e.preventDefault();
    }
  }, []);
  
  // Initialize with a welcome file
  useEffect(() => {
    const welcomeId = generateId();
    const initialFileSystem: FileSystemState = {
      items: {
        [welcomeId]: {
          id: welcomeId,
          name: 'welcome.js',
          type: 'file',
          content: `// Welcome to the Online Code Editor
// This editor runs completely in your browser
// You can:
// - Create and edit files and folders
// - Upload files and even entire folders (as ZIP)
// - Download your files
// - Switch between different themes
// - Syntax highlighting for many languages

console.log("Let's start coding!");`,
          language: 'javascript',
          parent: null
        }
      },
      rootItems: [welcomeId]
    };
    
    setFileSystem(initialFileSystem);
    setTabs([{
      id: generateId(),
      fileId: welcomeId,
      isActive: true
    }]);
    setCurrentContent(initialFileSystem.items[welcomeId].content || '');
    setCurrentLanguage('javascript');
    
    // Add event listener to prevent browser shortcuts
    document.addEventListener('keydown', preventBrowserShortcuts);
    
    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', preventBrowserShortcuts);
    };
  }, [preventBrowserShortcuts]);

  // Handle file/folder tree rendering
  const renderFileSystemItem = (itemId: string, depth: number = 0) => {
    const item = fileSystem.items[itemId];
    if (!item) return null;
    
    const isFolder = item.type === 'folder';
    const hasChildren = isFolder && item.children && item.children.length > 0;
    const isBeingDragged = draggedItem === itemId;
    const isDropTarget = dropTarget === itemId;
    const isCurrentlyRenaming = isRenaming && itemToRename === item.id;
    
    // Render rename input if this item is being renamed
    if (isCurrentlyRenaming) {
      return (
        <div key={item.id} className="fileSystemItem" style={{ paddingLeft: `${depth * 12}px` }}>
          <div className="flex items-center py-1 px-2 bg-gray-800 rounded">
            {isFolder ? 
              <FaFolder className="mr-2 text-yellow-400" /> : 
              <FaFile className="mr-2 text-blue-400" />
            }
            <Input 
              value={newItemRename}
              onChange={(e) => setNewItemRename(e.target.value)}
              className="h-6 py-0 text-sm bg-gray-700 border-gray-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') completeRenameItem();
                if (e.key === 'Escape') cancelRenameItem();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost" 
              size="sm"
              className="p-0 ml-1 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                completeRenameItem();
              }}
            >
              <FaCheck size={12} />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              className="p-0 ml-1 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                cancelRenameItem();
              }}
            >
              <FaTimes size={12} />
            </Button>
          </div>
        </div>
      );
    }
    
    // Regular item display
    return (
      <div key={item.id} className="fileSystemItem" style={{ paddingLeft: `${depth * 12}px` }}>
        <div 
          className={classNames("flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer", {
            'bg-gray-700/50': tabs.some(tab => tab.fileId === item.id && tab.isActive),
            'opacity-50': isBeingDragged,
            'bg-blue-900/30': isDropTarget && isFolder,
            'border border-blue-500': isDropTarget && isFolder
          })}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else {
              openFile(item.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Open context menu for this item
            setContextMenu({
              isOpen: true,
              position: { x: e.clientX, y: e.clientY },
              itemId: item.id
            });
          }}
          draggable={true}
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedItem(itemId);
            setIsDragging(true);
            e.dataTransfer.setData('text/plain', itemId);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDraggedItem(null);
            setDropTarget(null);
            setIsDragging(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Only set as drop target if it's a folder and not the item being dragged
            if (isFolder && itemId !== draggedItem) {
              setDropTarget(itemId);
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Only set as drop target if it's a folder and not the item being dragged
            if (isFolder && itemId !== draggedItem) {
              setDropTarget(itemId);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (dropTarget === itemId) {
              setDropTarget(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const droppedItemId = e.dataTransfer.getData('text/plain');
            
            // Only process if it's a folder and not the item being dragged
            if (isFolder && droppedItemId !== itemId) {
              moveItem(droppedItemId, itemId);
            }
            
            setDraggedItem(null);
            setDropTarget(null);
            setIsDragging(false);
          }}
        >
          {isFolder ? (
            <>
              {item.isOpen ? <FaChevronDown className="mr-1 text-gray-400 text-xs" /> : <FaChevronRight className="mr-1 text-gray-400 text-xs" />}
              {item.isOpen ? <FaFolderOpen className="mr-2 text-yellow-400" /> : <FaFolder className="mr-2 text-yellow-400" />}
            </>
          ) : (
            <FaFile className="mr-2 text-blue-400" />
          )}
          <span className="truncate">{item.name}</span>
          
          {/* File/Folder Context Actions */}
          <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100">
            {isFolder && (
              <button 
                className="p-1 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewItemParent(item.id);
                  setIsCreatingFile(true);
                }}
              >
                <FaPlus size={12} />
              </button>
            )}
            <button 
              className="p-1 text-gray-400 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>
        
        {isFolder && item.isOpen && item.children && (
          <div className="children">
            {item.children.map(childId => renderFileSystemItem(childId, depth + 1))}
            
            {/* New Item Input (conditionally rendered) */}
            {isCreatingFile && newItemParent === item.id && (
              <div className="pl-6 pr-2 py-1 flex items-center">
                <FaFile className="mr-2 text-blue-400" />
                <Input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="filename.ext"
                  className="h-7 py-1 text-sm bg-gray-800 border-gray-600"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createNewItem('file');
                    if (e.key === 'Escape') cancelNewItem();
                  }}
                />
                <Button
                  variant="ghost" 
                  size="sm"
                  className="p-1 ml-1 h-7 w-7"
                  onClick={() => createNewItem('file')}
                >
                  <FaPlus size={12} />
                </Button>
                <Button
                  variant="ghost" 
                  size="sm"
                  className="p-1 ml-1 h-7 w-7"
                  onClick={cancelNewItem}
                >
                  <FaTimes size={12} />
                </Button>
              </div>
            )}
            
            {isCreatingFolder && newItemParent === item.id && (
              <div className="pl-6 pr-2 py-1 flex items-center">
                <FaFolder className="mr-2 text-yellow-400" />
                <Input 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="folder name"
                  className="h-7 py-1 text-sm bg-gray-800 border-gray-600"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createNewItem('folder');
                    if (e.key === 'Escape') cancelNewItem();
                  }}
                />
                <Button
                  variant="ghost" 
                  size="sm"
                  className="p-1 ml-1 h-7 w-7"
                  onClick={() => createNewItem('folder')}
                >
                  <FaPlus size={12} />
                </Button>
                <Button
                  variant="ghost" 
                  size="sm"
                  className="p-1 ml-1 h-7 w-7"
                  onClick={cancelNewItem}
                >
                  <FaTimes size={12} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Toggle folder open/closed state
  const toggleFolder = (itemId: string) => {
    setFileSystem(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [itemId]: {
          ...prev.items[itemId],
          isOpen: !prev.items[itemId].isOpen
        }
      }
    }));
  };

  // Open a file in the editor
  const openFile = (fileId: string) => {
    const file = fileSystem.items[fileId];
    if (!file || file.type !== 'file') return;
    
    // Check if the file is already open in a tab
    const existingTabIndex = tabs.findIndex(tab => tab.fileId === fileId);
    
    if (existingTabIndex >= 0) {
      // File is already open, just make its tab active
      setTabs(prev => prev.map((tab, i) => ({
        ...tab,
        isActive: i === existingTabIndex
      })));
    } else {
      // Create a new tab for this file
      const newTab: EditorTab = {
        id: generateId(),
        fileId: fileId,
        isActive: true
      };
      
      setTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
    }
    
    // Set the editor content and language
    setCurrentContent(file.content || '');
    setCurrentLanguage(file.language || 'plaintext');
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const isActiveTab = tabs[tabIndex].isActive;
    
    // Remove the tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we closed the active tab, make another one active
    if (isActiveTab && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      newTabs[newActiveIndex].isActive = true;
      
      // Set content and language to the new active tab
      const activeFile = fileSystem.items[newTabs[newActiveIndex].fileId];
      setCurrentContent(activeFile.content || '');
      setCurrentLanguage(activeFile.language || 'plaintext');
    }
    
    setTabs(newTabs);
    
    // If there are no tabs left, clear the editor
    if (newTabs.length === 0) {
      setCurrentContent('');
      setCurrentLanguage('plaintext');
    }
  };

  // Switch to a different tab
  const switchTab = (tabId: string) => {
    const newTabs = tabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));
    
    setTabs(newTabs);
    
    // Set content and language to the active tab
    const activeTab = newTabs.find(tab => tab.isActive);
    if (activeTab) {
      const activeFile = fileSystem.items[activeTab.fileId];
      setCurrentContent(activeFile.content || '');
      setCurrentLanguage(activeFile.language || 'plaintext');
    }
  };

  // Create a new file or folder
  const createNewItem = (type: 'file' | 'folder') => {
    if (!newItemName.trim()) {
      cancelNewItem();
      return;
    }
    
    // Generate IDs
    const newItemId = generateId();
    
    // Create the new item
    const newItem: FileSystemItem = {
      id: newItemId,
      name: newItemName,
      type: type,
      parent: newItemParent,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageByFilename(newItemName) : undefined,
      children: type === 'folder' ? [] : undefined,
      isOpen: type === 'folder' ? true : undefined
    };
    
    // Update the file system
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      
      // Add the new item
      newFileSystem.items = {
        ...newFileSystem.items,
        [newItemId]: newItem
      };
      
      // Update parent's children or root items
      if (newItemParent) {
        const parent = newFileSystem.items[newItemParent];
        newFileSystem.items[newItemParent] = {
          ...parent,
          children: [...(parent.children || []), newItemId]
        };
      } else {
        newFileSystem.rootItems = [...newFileSystem.rootItems, newItemId];
      }
      
      return newFileSystem;
    });
    
    // Open the file immediately if it's a file
    if (type === 'file') {
      const newTab: EditorTab = {
        id: generateId(),
        fileId: newItemId,
        isActive: true
      };
      
      setTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
      
      setCurrentContent('');
      setCurrentLanguage(getLanguageByFilename(newItemName));
    }
    
    // Reset state
    cancelNewItem();
  };

  // Cancel new item creation
  const cancelNewItem = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewItemName('');
    setNewItemParent(null);
  };

  // Move file or folder to another folder
  const moveItem = (itemId: string, targetFolderId: string | null) => {
    console.log(`Moving item ${itemId} to folder ${targetFolderId}`);
    
    // Get the item being moved
    const item = fileSystem.items[itemId];
    if (!item) {
      console.error("Item not found:", itemId);
      return;
    }
    
    // Don't move a folder into itself or its descendants
    if (item.type === 'folder') {
      let currentFolder = targetFolderId;
      while (currentFolder) {
        if (currentFolder === itemId) {
          console.error("Cannot move a folder into itself or its descendants");
          toast({
            title: "Move Failed",
            description: "Cannot move a folder into itself or its descendants",
            variant: "destructive"
          });
          return;
        }
        const folder = fileSystem.items[currentFolder];
        currentFolder = folder?.parent || null;
      }
    }
    
    // Update the file system
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      
      // Remove from the previous parent's children list
      if (item.parent === null) {
        // Item was in root, remove from rootItems
        newFileSystem.rootItems = newFileSystem.rootItems.filter(id => id !== itemId);
      } else {
        // Item was in a folder, remove from that folder's children
        const parentFolder = { ...newFileSystem.items[item.parent] };
        if (parentFolder.children) {
          parentFolder.children = parentFolder.children.filter(id => id !== itemId);
          newFileSystem.items = {
            ...newFileSystem.items,
            [parentFolder.id]: parentFolder
          };
        }
      }
      
      // Add to the new parent
      if (targetFolderId === null) {
        // Move to root
        newFileSystem.rootItems = [...newFileSystem.rootItems, itemId];
      } else {
        // Move to a folder
        const targetFolder = { ...newFileSystem.items[targetFolderId] };
        if (!targetFolder) {
          console.error("Target folder not found:", targetFolderId);
          return prev;
        }
        
        targetFolder.children = targetFolder.children || [];
        targetFolder.children = [...targetFolder.children, itemId];
        
        newFileSystem.items = {
          ...newFileSystem.items,
          [targetFolderId]: targetFolder
        };
      }
      
      // Update the item's parent
      newFileSystem.items = {
        ...newFileSystem.items,
        [itemId]: {
          ...newFileSystem.items[itemId],
          parent: targetFolderId
        }
      };
      
      console.log("Updated file system:", newFileSystem);
      return newFileSystem;
    });
    
    toast({
      title: "Item Moved",
      description: `${item.name} has been moved successfully`,
    });
    
    // Save the updated file system to localStorage
    setTimeout(() => saveToLocalStorage(workspaceName, false), 100);
  };

  // Delete a file or folder
  const deleteItem = (itemId: string) => {
    const item = fileSystem.items[itemId];
    if (!item) return;
    
    // Function to collect all descendant ids (for folders)
    const collectAllDescendants = (id: string): string[] => {
      const item = fileSystem.items[id];
      if (!item || item.type !== 'folder' || !item.children) return [id];
      
      return [
        id,
        ...item.children.flatMap(childId => collectAllDescendants(childId))
      ];
    };
    
    const itemsToDelete = collectAllDescendants(itemId);
    
    // Close any tabs associated with deleted files
    const tabsToClose = tabs.filter(tab => 
      itemsToDelete.includes(tab.fileId)
    );
    
    tabsToClose.forEach(tab => {
      closeTab(tab.id);
    });
    
    // Update the file system
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      
      // Remove the items from their parent's children list
      if (item.parent) {
        const parent = newFileSystem.items[item.parent];
        newFileSystem.items[item.parent] = {
          ...parent,
          children: parent.children?.filter(id => id !== itemId) || []
        };
      } else {
        // Remove from root items
        newFileSystem.rootItems = newFileSystem.rootItems.filter(id => id !== itemId);
      }
      
      // Remove the items themselves
      const newItems = { ...newFileSystem.items };
      itemsToDelete.forEach(id => {
        delete newItems[id];
      });
      
      newFileSystem.items = newItems;
      
      return newFileSystem;
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check if a folder was uploaded (WebkitRelativePath is populated)
    const isFolder = files[0].webkitRelativePath !== '';
    
    if (isFolder) {
      processWebkitFolderUpload(files);
    } else {
      // Check if it's a ZIP file
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        processZipFile(file);
      } else {
        processSingleFile(file);
      }
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process a single file upload
  const processSingleFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Create a new file in the root
      const newFileId = generateId();
      const language = getLanguageByFilename(file.name);
      
      // Update the file system
      setFileSystem(prev => {
        const newFileSystem = { ...prev };
        
        newFileSystem.items = {
          ...newFileSystem.items,
          [newFileId]: {
            id: newFileId,
            name: file.name,
            type: 'file',
            content: content,
            language: language,
            parent: null
          }
        };
        
        newFileSystem.rootItems = [...newFileSystem.rootItems, newFileId];
        
        return newFileSystem;
      });
      
      // Open the file
      const newTab: EditorTab = {
        id: generateId(),
        fileId: newFileId,
        isActive: true
      };
      
      setTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
      
      setCurrentContent(content);
      setCurrentLanguage(language);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been added to your workspace`,
      });
    };
    
    reader.readAsText(file);
  };

  // Process a ZIP file upload
  const processZipFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (!content) throw new Error("Could not read ZIP file");
        
        const zip = new JSZip();
        const loaded = await zip.loadAsync(content);
        
        // Map to store folders by path for quick lookup
        const folderMap: Record<string, string> = { '': '' }; // Empty string is the root
        
        // First create all folders
        for (const relativePath in loaded.files) {
          const entry = loaded.files[relativePath];
          
          // Skip directories and empty files that are automatically added by JSZip
          if (entry.dir || relativePath.endsWith('/')) {
            // Create folder hierarchy
            const pathParts = relativePath.split('/').filter(Boolean);
            let currentPath = '';
            let parentId: string | null = null;
            
            for (let i = 0; i < pathParts.length; i++) {
              const folderName = pathParts[i];
              const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
              
              // Check if this folder already exists
              if (!folderMap[newPath]) {
                const folderId = generateId();
                folderMap[newPath] = folderId;
                
                // Create the folder in our file system
                setFileSystem(prev => {
                  const newFileSystem = { ...prev };
                  
                  newFileSystem.items = {
                    ...newFileSystem.items,
                    [folderId]: {
                      id: folderId,
                      name: folderName,
                      type: 'folder',
                      parent: parentId,
                      children: [],
                      isOpen: true
                    }
                  };
                  
                  // Add to parent's children or root
                  if (parentId) {
                    const parent = newFileSystem.items[parentId];
                    newFileSystem.items[parentId] = {
                      ...parent,
                      children: [...(parent.children || []), folderId]
                    };
                  } else {
                    newFileSystem.rootItems = [...newFileSystem.rootItems, folderId];
                  }
                  
                  return newFileSystem;
                });
              }
              
              parentId = folderMap[newPath];
              currentPath = newPath;
            }
          }
        }
        
        // Then add all files
        for (const relativePath in loaded.files) {
          const entry = loaded.files[relativePath];
          
          // Skip directories or empty files
          if (!entry.dir && !relativePath.endsWith('/')) {
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop() || '';
            const folderPath = pathParts.join('/');
            
            // Get the parent folder ID (or null for root)
            const parentId = folderMap[folderPath] || null;
            
            // Get file content
            const content = await entry.async('text');
            const fileId = generateId();
            const language = getLanguageByFilename(fileName);
            
            // Add the file
            setFileSystem(prev => {
              const newFileSystem = { ...prev };
              
              newFileSystem.items = {
                ...newFileSystem.items,
                [fileId]: {
                  id: fileId,
                  name: fileName,
                  type: 'file',
                  content: content,
                  language: language,
                  parent: parentId
                }
              };
              
              // Add to parent's children or root
              if (parentId) {
                const parent = newFileSystem.items[parentId];
                newFileSystem.items[parentId] = {
                  ...parent,
                  children: [...(parent.children || []), fileId]
                };
              } else {
                newFileSystem.rootItems = [...newFileSystem.rootItems, fileId];
              }
              
              return newFileSystem;
            });
          }
        }
        
        toast({
          title: "ZIP file extracted",
          description: `Files have been added to your workspace`,
        });
      } catch (error) {
        console.error("Error processing ZIP file:", error);
        toast({
          title: "Error",
          description: "Failed to process ZIP file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Process a folder upload using the webkitdirectory attribute
  const processWebkitFolderUpload = (fileList: FileList) => {
    // Convert FileList to array for easier processing
    const files = Array.from(fileList);
    
    // Map to store folders by path for quick lookup
    const folderMap: Record<string, string> = { '': '' }; // Empty string is the root
    
    // First create all folders
    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      pathParts.pop(); // Remove the filename
      
      let currentPath = '';
      let parentId: string | null = null;
      
      for (let i = 0; i < pathParts.length; i++) {
        const folderName = pathParts[i];
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        // Check if this folder already exists
        if (!folderMap[newPath]) {
          const folderId = generateId();
          folderMap[newPath] = folderId;
          
          // Create the folder in our file system
          setFileSystem(prev => {
            const newFileSystem = { ...prev };
            
            newFileSystem.items = {
              ...newFileSystem.items,
              [folderId]: {
                id: folderId,
                name: folderName,
                type: 'folder',
                parent: parentId,
                children: [],
                isOpen: true
              }
            };
            
            // Add to parent's children or root
            if (parentId) {
              const parent = newFileSystem.items[parentId];
              newFileSystem.items[parentId] = {
                ...parent,
                children: [...(parent.children || []), folderId]
              };
            } else {
              newFileSystem.rootItems = [...newFileSystem.rootItems, folderId];
            }
            
            return newFileSystem;
          });
        }
        
        parentId = folderMap[newPath];
        currentPath = newPath;
      }
    });
    
    // Then add all files
    files.forEach(file => {
      const reader = new FileReader();
      const pathParts = file.webkitRelativePath.split('/');
      const fileName = pathParts.pop() || '';
      const folderPath = pathParts.join('/');
      
      // Get the parent folder ID (or null for root)
      const parentId = folderMap[folderPath] || null;
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileId = generateId();
        const language = getLanguageByFilename(fileName);
        
        // Add the file
        setFileSystem(prev => {
          const newFileSystem = { ...prev };
          
          newFileSystem.items = {
            ...newFileSystem.items,
            [fileId]: {
              id: fileId,
              name: fileName,
              type: 'file',
              content: content,
              language: language,
              parent: parentId
            }
          };
          
          // Add to parent's children or root
          if (parentId) {
            const parent = newFileSystem.items[parentId];
            newFileSystem.items[parentId] = {
              ...parent,
              children: [...(parent.children || []), fileId]
            };
          } else {
            newFileSystem.rootItems = [...newFileSystem.rootItems, fileId];
          }
          
          return newFileSystem;
        });
      };
      
      reader.readAsText(file);
    });
    
    toast({
      title: "Folder uploaded",
      description: `Files have been added to your workspace`,
    });
  };

  // Save changes to the current file
  const saveCurrentFile = () => {
    console.log("Save button clicked - saveCurrentFile function called");
    console.log("Current workspace name:", workspaceName);
    console.log("Current content length:", currentContent?.length || 0);
    console.log("Tabs:", tabs);
    console.log("FileSystem rootItems:", fileSystem.rootItems);
    console.log("FileSystem items count:", Object.keys(fileSystem.items).length);
    
    // If there are no tabs but we have content, use our more reliable dedicated function
    if (tabs.length === 0 && currentContent) {
      console.log("No tabs exist but we have content - using createNewFileWithContent");
      return createNewFileWithContent();
    }
    
    // Find active tab
    const activeTab = tabs.find(tab => tab.isActive);
    if (!activeTab) {
      console.log("No active tab found, checking if we have any tabs at all");
      
      // If we have tabs, but none are active, activate the first one
      if (tabs.length > 0) {
        console.log("We have tabs but none are active - activating first tab");
        
        setTabs(prev => 
          prev.map((tab, index) => ({
            ...tab,
            isActive: index === 0
          }))
        );
        
        // After setting the first tab as active, try to save again
        setTimeout(saveCurrentFile, 100);
        return;
      }
      
      // If we have content but no tabs, create a new file
      if (currentContent && currentContent.trim() !== '') {
        console.log("No tabs but have content - creating new file with createNewFileWithContent");
        return createNewFileWithContent();
      }
      
      console.log("No tabs found and no content, returning without saving");
      toast({
        title: "Nothing to Save",
        description: "There is no content to save",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Active tab found:", activeTab);
    
    setFileSystem(prev => {
      const fileId = activeTab.fileId;
      const file = prev.items[fileId];
      
      if (!file) {
        console.log("File not found in fileSystem:", fileId);
        console.log("Available file IDs:", Object.keys(prev.items));
        return prev;
      }
      
      console.log("Updating file content for:", file.name);
      
      const newFileSystem = {
        ...prev,
        items: {
          ...prev.items,
          [fileId]: {
            ...file,
            content: currentContent
          }
        }
      };
      
      return newFileSystem;
    });
    
    // Save to current workspace's localStorage
    console.log("Calling saveToLocalStorage with workspace:", workspaceName);
    saveToLocalStorage(workspaceName, true);
    setLastSaveTime(new Date());
    
    // Always show a toast notification on save
    toast({
      title: "File Saved",
      description: `File saved to "${workspaceName}" workspace`,
    });
  };

  // Handle code changes in the editor
  const handleEditorChange = (value: string | undefined) => {
    setCurrentContent(value || '');
  };

  // Create and save a new file with current content
  const createNewFileWithContent = useCallback(() => {
    console.log("Creating new file with current content");
    if (!currentContent) {
      console.log("No content to save");
      toast({
        title: "Nothing to Save",
        description: "There is no content to save",
        variant: "destructive"
      });
      return;
    }
    
    // Generate new IDs for file and tab
    const newFileId = generateId();
    const newTabId = generateId();
    const newFileName = "untitled.txt";
    const language = "plaintext";
    
    // Create file object
    const newFile = {
      id: newFileId,
      name: newFileName,
      type: 'file' as const,
      content: currentContent,
      language: language,
      parent: null
    };
    
    // Create tab object
    const newTab: EditorTab = {
      id: newTabId,
      fileId: newFileId,
      isActive: true
    };
    
    console.log("New file:", newFile);
    console.log("New tab:", newTab);
    
    // Update file system
    const updatedFileSystem = {
      ...fileSystem,
      items: {
        ...fileSystem.items,
        [newFileId]: newFile
      },
      rootItems: [...fileSystem.rootItems, newFileId]
    };
    
    // Update tabs - set all existing tabs to inactive
    const updatedTabs = [
      ...tabs.map(tab => ({ ...tab, isActive: false })),
      newTab
    ];
    
    // Save directly to localStorage
    try {
      const fileSystemString = JSON.stringify(updatedFileSystem);
      const tabsString = JSON.stringify(updatedTabs);
      
      console.log("Saving file system to localStorage:", fileSystemString.length, "bytes");
      console.log("Saving tabs to localStorage:", tabsString.length, "bytes");
      
      localStorage.setItem(`codeEditor_fileSystem_${workspaceName}`, fileSystemString);
      localStorage.setItem(`codeEditor_tabs_${workspaceName}`, tabsString);
      localStorage.setItem(`codeEditor_options_${workspaceName}`, JSON.stringify(editorOptions));
      
      // Update state
      setFileSystem(updatedFileSystem);
      setTabs(updatedTabs);
      setCurrentLanguage(language);
      setLastSaveTime(new Date());
      
      toast({
        title: "File Created and Saved",
        description: `New file "${newFileName}" has been created and saved`,
      });
      
      return true;
    } catch (error) {
      console.error("Error saving new file:", error);
      toast({
        title: "Save Failed",
        description: "Error creating and saving new file",
        variant: "destructive"
      });
      return false;
    }
  }, [currentContent, fileSystem, tabs, workspaceName, editorOptions]);

  // Generic save handler that works in all contexts
  const directSaveHandler = useCallback(() => {
    console.log("Direct save handler called");
    console.log("Current content length:", currentContent?.length || 0);
    console.log("Current tabs:", tabs);
    
    // If no tabs but we have content, create a new file
    if (tabs.length === 0 && currentContent) {
      console.log("No tabs but have content - creating new file");
      return createNewFileWithContent();
    }
    
    // If we have tabs, use the normal save function
    console.log("Have tabs - using normal save function");
    saveCurrentFile();
    return true;
  }, [tabs, currentContent, createNewFileWithContent, saveCurrentFile]);

  // Prevent default browser shortcuts that conflict with editor
  const preventDefaultHandler = useCallback((e: KeyboardEvent) => {
    // Prevent browser's save dialog when Ctrl+S is pressed 
    // and trigger direct save function explicitly
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      directSaveHandler();
      console.log("Ctrl+S prevented and direct save triggered");
    }
    // Prevent browser's find dialog when Ctrl+F is pressed
    // and open the search dialog
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setIsSearchOpen(true);
      console.log("Ctrl+F prevented and search dialog opened");
    }
  }, [directSaveHandler, setIsSearchOpen]);

  // Add event listener when editor is mounted and remove when unmounted
  useEffect(() => {
    window.addEventListener('keydown', preventDefaultHandler);
    return () => {
      window.removeEventListener('keydown', preventDefaultHandler);
    };
  }, [preventDefaultHandler]);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Setup editor keybindings with our direct save handler
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, directSaveHandler);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => setIsSearchOpen(true));
    
    // Focus the editor
    setTimeout(() => {
      editor.focus();
    }, 100);
  };

  // Format current code
  const formatCode = () => {
    if (!editorRef.current || !monaco) return;
    
    editorRef.current.getAction('editor.action.formatDocument').run();
    
    toast({
      title: "Code Formatted",
      description: "Your code has been formatted",
    });
  };

  // Execute JavaScript code
  const executeCode = () => {
    if (currentLanguage !== 'javascript' && currentLanguage !== 'typescript') {
      toast({
        title: "Execution Error",
        description: "Only JavaScript code can be executed in the browser",
        variant: "destructive"
      });
      return;
    }

    try {
      // Capture console output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;

      let output = '';

      console.log = (...args) => {
        output += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\\n';
        originalConsoleLog(...args);
      };

      console.error = (...args) => {
        output += 'ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\\n';
        originalConsoleError(...args);
      };

      console.warn = (...args) => {
        output += 'WARNING: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\\n';
        originalConsoleWarn(...args);
      };

      console.info = (...args) => {
        output += 'INFO: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\\n';
        originalConsoleInfo(...args);
      };

      // Execute the code
      const result = new Function(currentContent)();
      
      // Add the result if it's not undefined
      if (result !== undefined) {
        output += '\\nReturn value: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
      }

      // Restore original console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;

      // Set the output and open the console
      setExecuteResults(output || 'Code executed successfully (no console output)');
      setIsConsoleOpen(true);
    } catch (error) {
      setExecuteResults(`Execution error: ${error}`);
      setIsConsoleOpen(true);
      toast({
        title: "Execution Failed",
        description: `${error}`,
        variant: "destructive"
      });
    }
  };

  // Search in current file
  const handleSearch = () => {
    if (!editorRef.current || !searchTerm) return;
    
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    // Find all matches in the current model
    const matches = model.findMatches(
      searchTerm,
      true, // searchOnlyEditableRange
      false, // isRegex
      true, // matchCase
      null, // wordSeparators
      true, // captureMatches
    );
    
    if (matches && matches.length > 0) {
      editor.setSelection(matches[0].range);
      editor.revealPositionInCenter({ lineNumber: matches[0].range.startLineNumber, column: matches[0].range.startColumn });
    } else {
      toast({
        title: "Search Results",
        description: "No matches found",
      });
    }
  };

  // Replace in current file
  const handleReplace = () => {
    if (!editorRef.current || !searchTerm) return;
    
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    // Find all matches in the current model
    const matches = model.findMatches(
      searchTerm,
      true, // searchOnlyEditableRange
      false, // isRegex
      true, // matchCase
      null, // wordSeparators
      true, // captureMatches
    );
    
    if (matches && matches.length > 0) {
      // Get the selection or the first match if nothing is selected
      const selection = editor.getSelection();
      const range = selection.isEmpty() ? matches[0].range : selection;
      
      // Replace the text
      editor.executeEdits('replace', [
        { range, text: replaceTerm }
      ]);
      
      toast({
        title: "Replace Complete",
        description: `Replaced "${searchTerm}" with "${replaceTerm}"`,
      });
    } else {
      toast({
        title: "Replace Failed",
        description: "No matches found",
        variant: "destructive"
      });
    }
  };

  // Replace all in current file
  const handleReplaceAll = () => {
    if (!editorRef.current || !searchTerm) return;
    
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    
    // Find all matches in the current model
    const matches = model.findMatches(
      searchTerm,
      true, // searchOnlyEditableRange
      false, // isRegex
      true, // matchCase
      null, // wordSeparators
      true, // captureMatches
    );
    
    if (matches && matches.length > 0) {
      // Replace all matches
      editor.executeEdits('replaceAll', 
        matches.map((match: { range: any }) => ({
          range: match.range,
          text: replaceTerm
        }))
      );
      
      toast({
        title: "Replace All Complete",
        description: `Replaced ${matches.length} occurrences of "${searchTerm}" with "${replaceTerm}"`,
      });
    } else {
      toast({
        title: "Replace All Failed",
        description: "No matches found",
        variant: "destructive"
      });
    }
  };

  // Toggle line numbers
  const toggleLineNumbers = () => {
    setEditorOptions(prev => ({
      ...prev,
      lineNumbers: prev.lineNumbers === 'on' ? 'off' : 'on' as any
    }));
  };

  // Toggle minimap
  const toggleMinimap = () => {
    setEditorOptions(prev => ({
      ...prev,
      minimap: { enabled: !prev.minimap.enabled }
    }));
  };

  // Increase font size
  const increaseFontSize = () => {
    setEditorOptions(prev => ({
      ...prev,
      fontSize: prev.fontSize + 1
    }));
  };

  // Decrease font size
  const decreaseFontSize = () => {
    setEditorOptions(prev => ({
      ...prev,
      fontSize: Math.max(8, prev.fontSize - 1) // Don't go below 8
    }));
  };

  // Insert code snippet
  const insertCodeSnippet = (snippet: { name: string, code: string, language: string }) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();
    
    editor.executeEdits('insertSnippet', [
      {
        range: selection,
        text: snippet.code
      }
    ]);
    
    setIsSnippetsOpen(false);
    
    toast({
      title: "Snippet Inserted",
      description: `${snippet.name} has been inserted`
    });
  };

  // Load available workspaces from localStorage
  const loadWorkspaceList = () => {
    try {
      const workspaceList = localStorage.getItem('codeEditor_workspaceList');
      if (workspaceList) {
        setSavedWorkspaces(JSON.parse(workspaceList));
      } else {
        // Initialize with default workspace if none exist
        setSavedWorkspaces(['default']);
        localStorage.setItem('codeEditor_workspaceList', JSON.stringify(['default']));
      }
    } catch (error) {
      console.error('Failed to load workspace list:', error);
    }
  };

  // Save to localStorage
  const saveToLocalStorage = (name: string = workspaceName, showNotification: boolean = true) => {
    console.log("saveToLocalStorage called with name:", name);
    console.log("fileSystem:", fileSystem);
    console.log("tabs:", tabs);
    console.log("editorOptions:", editorOptions);
    
    try {
      // Save current workspace state
      const fileSystemString = JSON.stringify(fileSystem);
      const tabsString = JSON.stringify(tabs);
      const optionsString = JSON.stringify(editorOptions);
      
      console.log("JSON.stringify fileSystem length:", fileSystemString.length);
      console.log("JSON.stringify tabs length:", tabsString.length);
      console.log("JSON.stringify options length:", optionsString.length);
      
      localStorage.setItem(`codeEditor_fileSystem_${name}`, fileSystemString);
      localStorage.setItem(`codeEditor_tabs_${name}`, tabsString);
      localStorage.setItem(`codeEditor_options_${name}`, optionsString);
      
      console.log("Items saved to localStorage successfully");
      
      // Update workspace list if this is a new workspace
      if (!savedWorkspaces.includes(name)) {
        console.log("Adding new workspace to workspace list:", name);
        const updatedWorkspaces = [...savedWorkspaces, name];
        setSavedWorkspaces(updatedWorkspaces);
        localStorage.setItem('codeEditor_workspaceList', JSON.stringify(updatedWorkspaces));
      }
      
      // Show notification if requested
      if (showNotification) {
        toast({
          title: "Changes saved",
          description: `All changes saved to "${name}" workspace`,
          duration: 2000
        });
      }
      
      // Set as current workspace
      setWorkspaceName(name);
      localStorage.setItem('codeEditor_currentWorkspace', name);
      
      // Verify data was saved correctly
      const savedFileSystem = localStorage.getItem(`codeEditor_fileSystem_${name}`);
      if (savedFileSystem) {
        console.log("Verification: fileSystem saved successfully");
      } else {
        console.error("Verification failed: fileSystem not saved");
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save to browser storage. It might be disabled or full.",
        variant: "destructive"
      });
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = (name: string = workspaceName) => {
    try {
      const savedFileSystem = localStorage.getItem(`codeEditor_fileSystem_${name}`);
      const savedTabs = localStorage.getItem(`codeEditor_tabs_${name}`);
      const savedOptions = localStorage.getItem(`codeEditor_options_${name}`);
      
      if (savedFileSystem) {
        setFileSystem(JSON.parse(savedFileSystem));
      }
      
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
        
        // Set the content for the active tab
        const activeTab = parsedTabs.find((tab: EditorTab) => tab.isActive);
        if (activeTab) {
          const fileSystem = JSON.parse(savedFileSystem || '{}');
          const file = fileSystem.items[activeTab.fileId];
          if (file) {
            setCurrentContent(file.content || '');
            setCurrentLanguage(file.language || 'plaintext');
          }
        }
      }
      
      if (savedOptions) {
        setEditorOptions(JSON.parse(savedOptions));
      }
      
      // Set as current workspace
      setWorkspaceName(name);
      localStorage.setItem('codeEditor_currentWorkspace', name);
      
      toast({
        title: "Workspace Loaded",
        description: `Workspace "${name}" has been loaded from browser storage`
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load from browser storage",
        variant: "destructive"
      });
    }
  };
  
  // Create a new workspace
  const createNewWorkspace = (name: string) => {
    if (!name.trim()) {
      toast({
        title: "Invalid Workspace Name",
        description: "Please enter a valid workspace name",
        variant: "destructive"
      });
      return;
    }
    
    if (savedWorkspaces.includes(name)) {
      toast({
        title: "Workspace Exists",
        description: "A workspace with this name already exists",
        variant: "destructive"
      });
      return;
    }
    
    // Reset to a new empty workspace
    const welcomeId = generateId();
    const initialFileSystem: FileSystemState = {
      items: {
        [welcomeId]: {
          id: welcomeId,
          name: 'welcome.js',
          type: 'file',
          content: `// Welcome to your new workspace: ${name}
// This editor runs completely in your browser
// You can:
// - Create and edit files and folders
// - Upload files and even entire folders (as ZIP)
// - Download your files
// - Switch between different workspaces
// - Syntax highlighting for many languages

console.log("Let's start coding in workspace ${name}!");`,
          language: 'javascript',
          parent: null
        }
      },
      rootItems: [welcomeId]
    };
    
    setFileSystem(initialFileSystem);
    setTabs([{
      id: generateId(),
      fileId: welcomeId,
      isActive: true
    }]);
    setCurrentContent(initialFileSystem.items[welcomeId].content || '');
    setCurrentLanguage('javascript');
    
    // Save the new workspace
    saveToLocalStorage(name);
  };
  
  // Delete a workspace
  const deleteWorkspace = (name: string) => {
    if (name === 'default') {
      toast({
        title: "Cannot Delete Default",
        description: "The default workspace cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    // Remove workspace data from localStorage
    localStorage.removeItem(`codeEditor_fileSystem_${name}`);
    localStorage.removeItem(`codeEditor_tabs_${name}`);
    localStorage.removeItem(`codeEditor_options_${name}`);
    
    // Update workspace list
    const updatedWorkspaces = savedWorkspaces.filter(ws => ws !== name);
    setSavedWorkspaces(updatedWorkspaces);
    localStorage.setItem('codeEditor_workspaceList', JSON.stringify(updatedWorkspaces));
    
    // If we're deleting the current workspace, switch to default
    if (name === workspaceName) {
      loadFromLocalStorage('default');
    }
    
    toast({
      title: "Workspace Deleted",
      description: `Workspace "${name}" has been deleted`
    });
  };
  
  // Delete all localStorage data
  const deleteAllLocalStorage = () => {
    if (deleteConfirmInput !== "Confirm") {
      toast({
        title: "Confirmation Failed",
        description: "You must type 'Confirm' exactly to proceed with deletion",
        variant: "destructive"
      });
      return;
    }
    
    // Get all keys from localStorage
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('codeEditor_')) {
        keys.push(key);
      }
    }
    
    // Remove all code editor related localStorage items
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset state
    setSavedWorkspaces(['default']);
    setWorkspaceName('default');
    
    // Reset editor to initial state
    const welcomeId = generateId();
    const initialFileSystem: FileSystemState = {
      items: {
        [welcomeId]: {
          id: welcomeId,
          name: 'welcome.js',
          type: 'file',
          content: `// Welcome to the Online Code Editor
// This editor runs completely in your browser
// All previous workspaces have been cleared
// Your local storage has been emptied of all editor data

console.log("Starting fresh!");`,
          language: 'javascript',
          parent: null
        }
      },
      rootItems: [welcomeId]
    };
    
    setFileSystem(initialFileSystem);
    setTabs([{
      id: generateId(),
      fileId: welcomeId,
      isActive: true
    }]);
    setCurrentContent(initialFileSystem.items[welcomeId].content || '');
    setCurrentLanguage('javascript');
    
    // Close the confirmation dialog
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmInput("");
    
    toast({
      title: "All Data Deleted",
      description: "All code editor data has been cleared from your browser",
      duration: 5000
    });
  };

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const interval = setInterval(() => {
      if (tabs.length > 0) {
        // Only update the file system
        const activeTab = tabs.find(tab => tab.isActive);
        if (activeTab) {
          setFileSystem(prev => {
            const fileId = activeTab.fileId;
            const file = prev.items[fileId];
            
            return {
              ...prev,
              items: {
                ...prev.items,
                [fileId]: {
                  ...file,
                  content: currentContent
                }
              }
            };
          });
          
          // Save to current workspace's localStorage
          saveToLocalStorage(workspaceName);
          setLastSaveTime(new Date());
        }
      }
    }, autoSaveInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoSaveEnabled, autoSaveInterval, tabs, currentContent, workspaceName]);

  // Check for localStorage data on first load
  useEffect(() => {
    console.log("Running initial localStorage check effect");
    
    // Make sure localStorage is available
    try {
      const testKey = "codeEditor_testKey";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      console.log("localStorage is available");
    } catch (error) {
      console.error("localStorage is not available:", error);
      toast({
        title: "Storage Unavailable",
        description: "Your browser's localStorage is not available. Your data won't be saved between sessions.",
        variant: "destructive",
        duration: 10000
      });
      return;
    }
    
    // Load list of available workspaces
    loadWorkspaceList();
    
    // Get the current workspace name (if any)
    const currentWorkspace = localStorage.getItem('codeEditor_currentWorkspace') || 'default';
    console.log("Current workspace from localStorage:", currentWorkspace);
    
    // Check if there's saved data for the current workspace
    const hasWorkspaceData = localStorage.getItem(`codeEditor_fileSystem_${currentWorkspace}`);
    console.log("Has workspace data:", !!hasWorkspaceData);
    
    if (hasWorkspaceData) {
      // We have saved data, ask the user if they want to load it
      const shouldLoad = window.confirm(`Would you like to restore your previous workspace "${currentWorkspace}"?`);
      if (shouldLoad) {
        console.log("User confirmed loading workspace:", currentWorkspace);
        loadFromLocalStorage(currentWorkspace);
      } else {
        console.log("User declined loading workspace, using default");
        // Force save current state to ensure it's initialized properly
        setTimeout(() => {
          saveToLocalStorage(currentWorkspace);
        }, 1000);
      }
    }
    // If we have old format data, migrate it to the new format
    else if (localStorage.getItem('codeEditor_fileSystem')) {
      console.log("Found old format data, migrating to new format");
      // Migrate old data to default workspace
      const oldFileSystem = localStorage.getItem('codeEditor_fileSystem');
      const oldTabs = localStorage.getItem('codeEditor_tabs');
      const oldOptions = localStorage.getItem('codeEditor_options');
      
      if (oldFileSystem) localStorage.setItem('codeEditor_fileSystem_default', oldFileSystem);
      if (oldTabs) localStorage.setItem('codeEditor_tabs_default', oldTabs);
      if (oldOptions) localStorage.setItem('codeEditor_options_default', oldOptions);
      
      // Clean up old format
      localStorage.removeItem('codeEditor_fileSystem');
      localStorage.removeItem('codeEditor_tabs');
      localStorage.removeItem('codeEditor_options');
      
      // Ask the user if they want to load it
      const shouldLoad = window.confirm('Would you like to restore your previous workspace?');
      if (shouldLoad) {
        console.log("User confirmed loading migrated workspace");
        loadFromLocalStorage('default');
      } else {
        console.log("User declined loading migrated workspace");
        // Force save current state to ensure it's initialized properly
        setTimeout(() => {
          saveToLocalStorage('default');
        }, 1000);
      }
    } else {
      console.log("No existing workspaces found, saving initial state");
      // Force save current state to ensure it's initialized properly
      setTimeout(() => {
        saveToLocalStorage('default');
      }, 1000);
    }
  }, []);

  // Export the entire workspace as a ZIP file
  const exportWorkspace = async () => {
    try {
      const zip = new JSZip();
      
      // Recursive function to add files and folders to the zip
      const addToZip = (itemId: string, path: string = '') => {
        const item = fileSystem.items[itemId];
        
        if (item.type === 'file') {
          // Add file to zip
          zip.file(path + item.name, item.content || '');
        } else if (item.type === 'folder' && item.children) {
          // Create folder in zip
          const folderPath = path + item.name + '/';
          
          // Add children recursively
          item.children.forEach(childId => {
            addToZip(childId, folderPath);
          });
        }
      };
      
      // Add all root items
      fileSystem.rootItems.forEach(itemId => {
        addToZip(itemId);
      });
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Trigger download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code-editor-workspace.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Workspace exported",
        description: "Your files have been exported as a ZIP",
      });
    } catch (error) {
      console.error("Error exporting workspace:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting your workspace",
        variant: "destructive",
      });
    }
  };

  // Add document click handler for context menu and rename
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close context menu on any click outside
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
      
      // Close rename input on any click outside (after a small delay to allow the confirm button to work)
      if (isRenaming) {
        // Use setTimeout to ensure click handlers on the rename UI have time to fire
        setTimeout(() => {
          if (isRenaming) {
            cancelRenameItem();
          }
        }, 100);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.isOpen, isRenaming]);
  
  // Function to download a file
  const downloadFile = (fileId: string) => {
    const file = fileSystem.items[fileId];
    if (!file || file.type !== 'file' || !file.content) {
      toast({
        title: "Error",
        description: "Cannot download this file.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a blob and download link
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "Success",
      description: `${file.name} downloaded successfully.`,
    });
  };
  
  // Function to download a folder (future implementation)
  const downloadFolder = (folderId: string) => {
    const folder = fileSystem.items[folderId];
    if (!folder || folder.type !== 'folder') {
      toast({
        title: "Error",
        description: "Cannot download this folder.",
        variant: "destructive"
      });
      return;
    }
    
    // For now we'll use a placeholder, but this could be expanded to create a zip archive
    toast({
      title: "Coming Soon",
      description: "Folder download functionality will be added soon.",
    });
  };

  // Function to start renaming an item
  const startRenameItem = (itemId: string) => {
    const item = fileSystem.items[itemId];
    if (!item) return;
    
    setItemToRename(itemId);
    setNewItemRename(item.name);
    setIsRenaming(true);
  };
  
  // Function to cancel renaming
  const cancelRenameItem = () => {
    setItemToRename(null);
    setNewItemRename('');
    setIsRenaming(false);
  };
  
  // Function to complete renaming
  const completeRenameItem = () => {
    if (!itemToRename || !newItemRename.trim()) {
      cancelRenameItem();
      return;
    }
    
    const item = fileSystem.items[itemToRename];
    if (!item) {
      cancelRenameItem();
      return;
    }
    
    // Check if name already exists in the same folder
    const siblings = Object.values(fileSystem.items).filter(
      i => i.parent === item.parent && i.id !== item.id
    );
    
    if (siblings.some(s => s.name === newItemRename)) {
      toast({
        title: "Error",
        description: `An item named "${newItemRename}" already exists in this location.`,
        variant: "destructive"
      });
      return;
    }
    
    // Update file system
    setFileSystem(prev => {
      const updatedItems = { ...prev.items };
      
      // If this is a file, update the language based on the new filename
      if (item.type === 'file') {
        const newLanguage = getLanguageByFilename(newItemRename);
        
        updatedItems[itemToRename] = {
          ...updatedItems[itemToRename],
          name: newItemRename,
          language: newLanguage
        };
        
        // If this file is currently open, update the editor language
        const activeTab = tabs.find(tab => tab.fileId === itemToRename && tab.isActive);
        if (activeTab) {
          setCurrentLanguage(newLanguage);
        }
      } else {
        // Just update the name for folders
        updatedItems[itemToRename] = {
          ...updatedItems[itemToRename],
          name: newItemRename
        };
      }
      
      return {
        ...prev,
        items: updatedItems
      };
    });
    
    toast({
      title: "Success",
      description: `Renamed to "${newItemRename}".`
    });
    
    cancelRenameItem();
  };

  // Function to handle context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.itemId) return;
    
    const item = fileSystem.items[contextMenu.itemId];
    if (!item) return;
    
    switch (action) {
      case 'open':
        if (item.type === 'file') {
          openFile(item.id);
        } else {
          toggleFolder(item.id);
        }
        break;
      case 'rename':
        startRenameItem(item.id);
        break;
      case 'delete':
        deleteItem(item.id);
        break;
      case 'newFile':
        if (item.type === 'folder') {
          setNewItemParent(item.id);
          setIsCreatingFile(true);
        }
        break;
      case 'newFolder':
        if (item.type === 'folder') {
          setNewItemParent(item.id);
          setIsCreatingFolder(true);
        }
        break;
      case 'download':
        if (item.type === 'file') {
          downloadFile(item.id);
        } else {
          downloadFolder(item.id);
        }
        break;
      default:
        break;
    }
    
    // Close the context menu after action
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <VideoBackground opacity={0.10} />

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.itemId && (
        <div 
          className="fixed z-50 bg-gray-800 border border-gray-700 shadow-lg rounded py-1 overflow-hidden w-48"
          style={{ 
            left: `${contextMenu.position.x}px`, 
            top: `${contextMenu.position.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const item = fileSystem.items[contextMenu.itemId];
            if (!item) return null;
            
            const isFolder = item.type === 'folder';
            
            return (
              <>
                <div className="px-2 py-1 text-sm text-gray-400 border-b border-gray-700">
                  {item.name}
                </div>
                
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-700 text-left"
                  onClick={() => handleContextMenuAction('open')}
                >
                  {isFolder ? <FaFolderOpen className="mr-2 text-yellow-400" /> : <FaFile className="mr-2 text-blue-400" />}
                  {isFolder ? 'Open Folder' : 'Open File'}
                </button>
                
                {isFolder && (
                  <>
                    <button 
                      className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-700 text-left"
                      onClick={() => handleContextMenuAction('newFile')}
                    >
                      <FaFile className="mr-2 text-blue-400" />
                      New File
                    </button>
                    
                    <button 
                      className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-700 text-left"
                      onClick={() => handleContextMenuAction('newFolder')}
                    >
                      <FaFolder className="mr-2 text-yellow-400" />
                      New Folder
                    </button>
                  </>
                )}
                
                <div className="border-t border-gray-700 my-1"></div>
                
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-700 text-left"
                  onClick={() => handleContextMenuAction('rename')}
                >
                  <FaEdit className="mr-2 text-green-400" />
                  Rename
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-gray-700 text-left"
                  onClick={() => handleContextMenuAction('download')}
                >
                  <FaDownload className="mr-2 text-purple-400" />
                  Download
                </button>
                
                <div className="border-t border-gray-700 my-1"></div>
                
                <button 
                  className="flex items-center w-full px-4 py-1.5 text-sm hover:bg-red-800 text-left text-red-400"
                  onClick={() => handleContextMenuAction('delete')}
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
              </>
            );
          })()}
        </div>
      )}

      <main className="flex-grow relative z-10 pt-24 pb-8">
        <Container maxWidth="6xl" className="h-full max-w-[95vw]">
          <Card className="h-[80vh] overflow-hidden bg-gray-900/70 backdrop-blur border-gray-800">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-1 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-0.5">
                {/* File Operations */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => {
                          setNewItemParent(null);
                          setIsCreatingFile(true);
                        }}
                      >
                        <FaPlus size={14} />
                        <span className="ml-1">New</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => {
                          setNewItemParent(null);
                          setIsCreatingFolder(true);
                        }}
                      >
                        <FaFolder size={14} />
                        <span className="ml-1">Folder</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-1.5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FaUpload size={14} />
                          <span className="ml-1">Upload</span>
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          multiple
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload files (including ZIP archives)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Separator orientation="vertical" className="h-6 bg-gray-700" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={directSaveHandler}
                        disabled={!currentContent}
                      >
                        <FaSave size={14} />
                        <span className="ml-1">Save</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save current file (to browser memory)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={exportWorkspace}
                      >
                        <FaUpload className="transform rotate-180" size={14} />
                        <span className="ml-1">Export</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export all files as ZIP</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center space-x-0.5">
                {/* Editor features */}
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setIsSearchOpen(true)}
                      >
                        <FaSearch size={14} />
                        <span className="ml-1">Find</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search in file (Ctrl+F)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={formatCode}
                        disabled={tabs.length === 0}
                      >
                        <FaCode size={14} />
                        <span className="ml-1">Format</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Format code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={executeCode}
                        disabled={tabs.length === 0 || !(currentLanguage === 'javascript' || currentLanguage === 'typescript')}
                      >
                        <FaPlay size={14} />
                        <span className="ml-1">Run</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Execute JavaScript code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setIsSnippetsOpen(true)}
                      >
                        <FaCode size={14} />
                        <span className="ml-1">Snippets</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Insert code snippets</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                
                {/* Workspace Manager */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setIsWorkspaceManagerOpen(true)}
                      >
                        <FaFolderOpen size={14} />
                        <span className="ml-1">Workspaces</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage workspaces</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                
                {/* Editor settings */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        <FaInfoCircle size={14} />
                        <span className="ml-1">Settings</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editor settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setIsKeyboardShortcutsOpen(true)}
                      >
                        <FaKeyboard size={14} />
                        <span className="ml-1">Keys</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Keyboard shortcuts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Theme Toggler */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => setEditorTheme(theme => theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                      >
                        {editorTheme === 'vs-dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle editor theme</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Main Layout */}
            <Split
              className="flex h-[calc(100%-2.5rem)]"
              sizes={[20, 80]}
              minSize={150}
              gutterSize={4}
              gutterStyle={() => ({
                backgroundColor: '#374151',
              })}
              gutterAlign="center"
            >
              {/* File Explorer */}
              <div className="h-full bg-gray-900 overflow-y-auto p-2">
                <div className="font-semibold mb-2 text-gray-300">EXPLORER</div>
                
                <div className="fileExplorer text-sm text-gray-300">
                  {/* Root-level New Item Inputs */}
                  {isCreatingFile && newItemParent === null && (
                    <div className="flex items-center py-1 px-2">
                      <FaFile className="mr-2 text-blue-400" />
                      <Input 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="filename.ext"
                        className="h-7 py-1 text-sm bg-gray-800 border-gray-600"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') createNewItem('file');
                          if (e.key === 'Escape') cancelNewItem();
                        }}
                      />
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="p-1 ml-1 h-7 w-7"
                        onClick={() => createNewItem('file')}
                      >
                        <FaPlus size={12} />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="p-1 ml-1 h-7 w-7"
                        onClick={cancelNewItem}
                      >
                        <FaTimes size={12} />
                      </Button>
                    </div>
                  )}
                  
                  {isCreatingFolder && newItemParent === null && (
                    <div className="flex items-center py-1 px-2">
                      <FaFolder className="mr-2 text-yellow-400" />
                      <Input 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="folder name"
                        className="h-7 py-1 text-sm bg-gray-800 border-gray-600"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') createNewItem('folder');
                          if (e.key === 'Escape') cancelNewItem();
                        }}
                      />
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="p-1 ml-1 h-7 w-7"
                        onClick={() => createNewItem('folder')}
                      >
                        <FaPlus size={12} />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="p-1 ml-1 h-7 w-7"
                        onClick={cancelNewItem}
                      >
                        <FaTimes size={12} />
                      </Button>
                    </div>
                  )}
                  
                  {/* Render File Tree */}
                  {fileSystem.rootItems.map(itemId => renderFileSystemItem(itemId))}
                </div>
              </div>

              {/* Editor Section */}
              <div className="h-full flex flex-col">
                {/* Tabs */}
                <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto no-scrollbar">
                  {tabs.map(tab => {
                    const file = fileSystem.items[tab.fileId];
                    if (!file) return null;
                    
                    return (
                      <div 
                        key={tab.id}
                        className={classNames(
                          "flex items-center px-3 py-1 border-r border-gray-700 cursor-pointer max-w-xs",
                          {
                            'bg-gray-700': tab.isActive,
                            'hover:bg-gray-700/50': !tab.isActive
                          }
                        )}
                        onClick={() => switchTab(tab.id)}
                      >
                        <FaFile className="mr-2 text-blue-400" size={12} />
                        <span className="truncate text-sm">{file.name}</span>
                        <button 
                          className="ml-2 text-gray-400 hover:text-white p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Monaco Editor */}
                <div className="flex-grow">
                  <Editor
                    height="100%"
                    language={currentLanguage}
                    theme={editorTheme}
                    value={currentContent}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={editorOptions}
                  />
                </div>
              </div>
            </Split>
          </Card>
        </Container>
      </main>

      <Footer />

      {/* Search/Replace Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Search & Replace</DialogTitle>
            <DialogDescription className="text-gray-400">
              Find text in the current file and optionally replace it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search for</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Text to find..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replacement text..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between space-x-2 sm:space-x-2">
            <Button variant="outline" onClick={handleSearch} disabled={!searchTerm}>
              Find
            </Button>
            <Button variant="outline" onClick={handleReplace} disabled={!searchTerm}>
              Replace
            </Button>
            <Button variant="outline" onClick={handleReplaceAll} disabled={!searchTerm}>
              Replace All
            </Button>
            <Button variant="outline" onClick={() => setIsSearchOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Console Output Dialog */}
      <Dialog open={isConsoleOpen} onOpenChange={setIsConsoleOpen}>
        <DialogContent className="sm:max-w-xl bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Console Output</DialogTitle>
            <DialogDescription className="text-gray-400">
              Results from executing your JavaScript code.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <div className="bg-gray-900 border border-gray-700 rounded-md p-4 font-mono text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
              {executeResults}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConsoleOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editor Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Editor Settings</DialogTitle>
            <DialogDescription className="text-gray-400">
              Customize your code editor experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="line-numbers">Line Numbers</Label>
              <Switch
                id="line-numbers"
                checked={editorOptions.lineNumbers === 'on'}
                onCheckedChange={toggleLineNumbers}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="minimap">Minimap</Label>
              <Switch
                id="minimap"
                checked={editorOptions.minimap.enabled}
                onCheckedChange={toggleMinimap}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size">Font Size: {editorOptions.fontSize}px</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={decreaseFontSize}
                    className="h-8 w-8 p-0"
                  >
                    <FaMinus size={12} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={increaseFontSize}
                    className="h-8 w-8 p-0"
                  >
                    <FaPlusIcon size={12} />
                  </Button>
                </div>
              </div>
            </div>
            <Separator className="bg-gray-700" />
            <div className="space-y-2">
              <Label htmlFor="auto-save">Auto Save</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
                <span className="text-sm text-gray-400">
                  {autoSaveEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {autoSaveEnabled && (
                <div className="mt-2">
                  <Label htmlFor="auto-save-interval">Interval (seconds): {autoSaveInterval}</Label>
                  <Slider
                    id="auto-save-interval"
                    min={5}
                    max={60}
                    step={5}
                    value={[autoSaveInterval]}
                    onValueChange={(value) => setAutoSaveInterval(value[0])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5s</span>
                    <span>60s</span>
                  </div>
                  {lastSaveTime && (
                    <div className="text-xs text-gray-400 mt-2 flex items-center">
                      <FaClock className="mr-1" size={12} />
                      Last saved: {lastSaveTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator className="bg-gray-700" />
            <div className="flex items-center justify-between">
              <Label>Workspace Storage</Label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => saveToLocalStorage()}
                >
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadFromLocalStorage()}
                >
                  Load
                </Button>
              </div>
            </div>
            
            <Separator className="bg-gray-700 my-2" />
            <div className="space-y-2">
              <Label className="text-red-500">Danger Zone</Label>
              <div className="border border-red-800 rounded-md p-3 bg-red-950/30">
                <h4 className="text-sm font-medium mb-1 text-red-400">Delete All Data</h4>
                <p className="text-xs text-gray-400 mb-2">
                  This will permanently delete ALL workspaces and editor data from your browser's 
                  local storage. This action CANNOT be undone.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-full"
                >
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-red-500">⚠️ Warning: Delete All Data</DialogTitle>
            <DialogDescription className="text-gray-400">
              <p className="my-2">You are about to delete <strong>ALL</strong> workspaces and code editor data stored in your browser.</p>
              <div className="my-2 border border-red-800 rounded-md p-3 bg-red-950/30">
                <h4 className="text-sm font-medium text-red-400">This action cannot be undone!</h4>
                <p className="text-xs text-gray-300 mt-1">
                  All your workspaces, files, folders, and editor settings will be permanently deleted.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Label htmlFor="confirm-delete" className="text-white">
              To confirm, type <strong className="text-red-500 font-mono">Confirm</strong> below:
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              placeholder="Type 'Confirm' here"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={() => {
              setIsDeleteConfirmOpen(false);
              setDeleteConfirmInput("");
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteAllLocalStorage}
              disabled={deleteConfirmInput !== "Confirm"}
            >
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={isKeyboardShortcutsOpen} onOpenChange={setIsKeyboardShortcutsOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Helpful keyboard shortcuts for the code editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-semibold">Ctrl+S</div>
              <div>Save current file</div>
              
              <div className="font-semibold">Ctrl+F</div>
              <div>Open search panel</div>
              
              <div className="font-semibold">Ctrl+Space</div>
              <div>Trigger suggestions</div>
              
              <div className="font-semibold">Ctrl+/</div>
              <div>Toggle line comment</div>
              
              <div className="font-semibold">Shift+Alt+F</div>
              <div>Format document</div>
              
              <div className="font-semibold">Ctrl+Shift+K</div>
              <div>Delete line</div>
              
              <div className="font-semibold">Alt+Up/Down</div>
              <div>Move line up/down</div>
              
              <div className="font-semibold">Ctrl+G</div>
              <div>Go to line</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Snippets Dialog */}
      <Dialog open={isSnippetsOpen} onOpenChange={setIsSnippetsOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Code Snippets</DialogTitle>
            <DialogDescription className="text-gray-400">
              Insert common code patterns and boilerplates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto">
            {codeSnippets.map((snippet, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded-md p-3 cursor-pointer hover:bg-gray-700"
                onClick={() => insertCodeSnippet(snippet)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{snippet.name}</div>
                  <div className="text-xs text-gray-400">{snippet.language}</div>
                </div>
                <div className="text-xs text-gray-400 mt-1 truncate">
                  {snippet.code.split('\n')[0]}...
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Workspace Manager Dialog */}
      <Dialog open={isWorkspaceManagerOpen} onOpenChange={setIsWorkspaceManagerOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Workspace Manager</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create, switch between, and manage your workspaces.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-sm font-medium mb-1">Current Workspace</h3>
              <Badge variant="secondary" className="font-mono text-white bg-gray-700">{workspaceName}</Badge>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Create New Workspace</h3>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Workspace name" 
                  className="bg-gray-800 border-gray-700"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    createNewWorkspace(newItemName);
                    setNewItemName('');
                  }}
                  disabled={!newItemName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Available Workspaces</h3>
              <ScrollArea className="h-[140px] rounded-md border border-gray-700">
                <div className="p-2">
                  {savedWorkspaces.length === 0 ? (
                    <div className="text-gray-400 text-sm py-2">No saved workspaces</div>
                  ) : (
                    <div className="space-y-1">
                      {savedWorkspaces.map((name) => (
                        <div key={name} className="flex items-center justify-between py-1">
                          <span className={workspaceName === name ? "font-medium text-blue-400" : ""}>
                            {name}
                          </span>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2"
                              onClick={() => {
                                loadFromLocalStorage(name);
                                setIsWorkspaceManagerOpen(false);
                              }}
                            >
                              <FaFolderOpen size={12} className="mr-1" />
                              Open
                            </Button>
                            {name !== 'default' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => deleteWorkspace(name)}
                              >
                                <FaTrash size={12} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkspaceManagerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineCodeEditor;