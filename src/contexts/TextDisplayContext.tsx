import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type TextMode = 'hiragana' | 'kanji';

interface TextDisplayContextType {
  textMode: TextMode;
  toggleTextMode: () => void;
  getText: (hiragana: string, kanji: string) => string;
}

const TextDisplayContext = createContext<TextDisplayContextType | undefined>(undefined);

interface TextDisplayProviderProps {
  children: ReactNode;
}

export const TextDisplayProvider = ({ children }: TextDisplayProviderProps) => {
  const [textMode, setTextMode] = useState<TextMode>('hiragana');

  // LocalStorageから設定を復元
  useEffect(() => {
    const savedMode = localStorage.getItem('textMode') as TextMode;
    if (savedMode && (savedMode === 'hiragana' || savedMode === 'kanji')) {
      setTextMode(savedMode);
    }
  }, []);

  // モード変更時にLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('textMode', textMode);
  }, [textMode]);

  const toggleTextMode = () => {
    setTextMode(prev => prev === 'hiragana' ? 'kanji' : 'hiragana');
  };

  const getText = (hiragana: string, kanji: string) => {
    return textMode === 'hiragana' ? hiragana : kanji;
  };

  return (
    <TextDisplayContext.Provider value={{ textMode, toggleTextMode, getText }}>
      {children}
    </TextDisplayContext.Provider>
  );
};

export const useTextDisplay = () => {
  const context = useContext(TextDisplayContext);
  if (context === undefined) {
    throw new Error('useTextDisplay must be used within a TextDisplayProvider');
  }
  return context;
};