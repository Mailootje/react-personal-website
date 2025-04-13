import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import Split from 'react-split';
import { FaFolder, FaFile, FaFolderOpen, FaChevronDown, FaChevronRight, FaPlus, FaUpload, FaSave, FaTrash, FaTimes } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
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
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
                    options={editorOptions}
                  />
                </div>
              </div>
            </Split>
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default OnlineCodeEditor;