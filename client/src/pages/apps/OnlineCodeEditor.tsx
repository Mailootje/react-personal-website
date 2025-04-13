import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import Split from 'react-split';
import { 
  FaFolder, FaFile, FaFolderOpen, FaChevronDown, FaChevronRight, FaPlus, 
  FaUpload, FaSave, FaTrash, FaTimes, FaSearch, FaExchangeAlt, FaCode, 
  FaMinus, FaPlus as FaPlusIcon, FaList, FaMap, FaPlay, FaInfoCircle,
  FaKeyboard, FaClock, FaCheck
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
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30); // seconds
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
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
  }, []);

  // Handle file/folder tree rendering
  const renderFileSystemItem = (itemId: string, depth: number = 0) => {
    const item = fileSystem.items[itemId];
    if (!item) return null;
    
    const isFolder = item.type === 'folder';
    const hasChildren = isFolder && item.children && item.children.length > 0;
    
    return (
      <div key={item.id} className="fileSystemItem" style={{ paddingLeft: `${depth * 12}px` }}>
        <div 
          className={classNames("flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer", {
            'bg-gray-700/50': tabs.some(tab => tab.fileId === item.id && tab.isActive)
          })}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else {
              openFile(item.id);
            }
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
    const activeTab = tabs.find(tab => tab.isActive);
    if (!activeTab) return;
    
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
    
    toast({
      title: "File saved",
      description: `Changes have been saved to memory`,
    });
  };

  // Handle code changes in the editor
  const handleEditorChange = (value: string | undefined) => {
    setCurrentContent(value || '');
  };

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Setup editor keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCurrentFile);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => setIsSearchOpen(true));
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

  // Save to localStorage
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('codeEditor_fileSystem', JSON.stringify(fileSystem));
      localStorage.setItem('codeEditor_tabs', JSON.stringify(tabs));
      localStorage.setItem('codeEditor_options', JSON.stringify(editorOptions));
      
      toast({
        title: "Workspace Saved",
        description: "Your workspace has been saved to browser storage"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save to browser storage. It might be disabled or full.",
        variant: "destructive"
      });
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const savedFileSystem = localStorage.getItem('codeEditor_fileSystem');
      const savedTabs = localStorage.getItem('codeEditor_tabs');
      const savedOptions = localStorage.getItem('codeEditor_options');
      
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
      
      toast({
        title: "Workspace Loaded",
        description: "Your saved workspace has been loaded from browser storage"
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load from browser storage",
        variant: "destructive"
      });
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const interval = setInterval(() => {
      if (tabs.length > 0) {
        saveCurrentFile();
        setLastSaveTime(new Date());
      }
    }, autoSaveInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoSaveEnabled, autoSaveInterval, tabs]);

  // Check for localStorage data on first load
  useEffect(() => {
    if (localStorage.getItem('codeEditor_fileSystem')) {
      // We have saved data, ask the user if they want to load it
      const shouldLoad = window.confirm('Would you like to restore your previous workspace?');
      if (shouldLoad) {
        loadFromLocalStorage();
      }
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

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <VideoBackground opacity={0.10} />

      <main className="flex-grow relative z-10 pt-24 pb-8">
        <Container maxWidth="6xl" className="h-full">
          <Card className="h-[80vh] overflow-hidden bg-gray-900/70 backdrop-blur border-gray-800">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                {/* File Operations */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          setNewItemParent(null);
                          setIsCreatingFile(true);
                        }}
                      >
                        <FaPlus className="mr-2" size={14} />
                        <span>New File</span>
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
                        className="h-8 px-2"
                        onClick={() => {
                          setNewItemParent(null);
                          setIsCreatingFolder(true);
                        }}
                      >
                        <FaFolder className="mr-2" size={14} />
                        <span>New Folder</span>
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
                          className="h-8 px-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FaUpload className="mr-2" size={14} />
                          <span>Upload</span>
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
                        className="h-8 px-2"
                        onClick={saveCurrentFile}
                        disabled={tabs.length === 0}
                      >
                        <FaSave className="mr-2" size={14} />
                        <span>Save</span>
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
                        className="h-8 px-2"
                        onClick={exportWorkspace}
                      >
                        <FaUpload className="mr-2 transform rotate-180" size={14} />
                        <span>Export</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export all files as ZIP</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center space-x-2">
                {/* Editor features */}
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setIsSearchOpen(true)}
                      >
                        <FaSearch className="mr-2" size={14} />
                        <span>Search</span>
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
                        className="h-8 px-2"
                        onClick={formatCode}
                        disabled={tabs.length === 0}
                      >
                        <FaCode className="mr-2" size={14} />
                        <span>Format</span>
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
                        className="h-8 px-2"
                        onClick={executeCode}
                        disabled={tabs.length === 0 || !(currentLanguage === 'javascript' || currentLanguage === 'typescript')}
                      >
                        <FaPlay className="mr-2" size={14} />
                        <span>Execute</span>
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
                        className="h-8 px-2"
                        onClick={() => setIsSnippetsOpen(true)}
                      >
                        <FaCode className="mr-2" size={14} />
                        <span>Snippets</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Insert code snippets</p>
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
                        className="h-8 px-2"
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        <FaInfoCircle className="mr-2" size={14} />
                        <span>Settings</span>
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
                        className="h-8 px-2"
                        onClick={() => setIsKeyboardShortcutsOpen(true)}
                      >
                        <FaKeyboard className="mr-2" size={14} />
                        <span>Shortcuts</span>
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
                        className="h-8 px-2"
                        onClick={() => setEditorTheme(theme => theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
                      >
                        {editorTheme === 'vs-dark' ? 'Light Mode' : 'Dark Mode'}
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
                  onClick={saveToLocalStorage}
                >
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadFromLocalStorage}
                >
                  Load
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default OnlineCodeEditor;