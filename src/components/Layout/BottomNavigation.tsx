import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Target, Calendar, BarChart3, Wallet } from 'lucide-react';
import { useTextDisplay } from '../../contexts/TextDisplayContext';
import { TEXT_MAPPINGS } from '../../utils/textMappings';
import type { NavigationTab } from '../../types';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { textMode } = useTextDisplay();

  const tabs: NavigationTab[] = [
    {
      id: 'complete',
      icon: 'Home',
      label: TEXT_MAPPINGS.completed[textMode],
      path: '/app/complete'
    },
    {
      id: 'goals',
      icon: 'Target',
      label: TEXT_MAPPINGS.goal[textMode],
      path: '/app/goals'
    },
    {
      id: 'calendar',
      icon: 'Calendar',
      label: TEXT_MAPPINGS.calendar[textMode],
      path: '/app/calendar'
    },
    {
      id: 'stats',
      icon: 'BarChart3',
      label: TEXT_MAPPINGS.statistics[textMode],
      path: '/app/stats'
    },
    {
      id: 'money',
      icon: 'Wallet',
      label: TEXT_MAPPINGS.allowance[textMode],
      path: '/app/money'
    }
  ];

  const getIcon = (iconName: string, isActive: boolean) => {
    const className = `h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`;

    switch (iconName) {
      case 'Home':
        return <Home className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Calendar':
        return <Calendar className={className} />;
      case 'BarChart3':
        return <BarChart3 className={className} />;
      case 'Wallet':
        return <Wallet className={className} />;
      default:
        return <Home className={className} />;
    }
  };

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path ||
                           (tab.path === '/app/complete' && location.pathname === '/app');

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`flex flex-col items-center justify-center py-2 px-1 min-w-[70px] transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {getIcon(tab.icon, isActive)}
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;