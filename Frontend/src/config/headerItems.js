import SparklesIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';

export const mainNavItems = [
    {
        id: 'ai-chat',
        label: 'AI Chat',
        icon: SparklesIcon,
        path: '/ai-chat',
        activePaths: ['/ai-chat'],
    },
    {
        id: 'system-prompts',
        label: 'System Prompts',
        icon: SettingsIcon,
        path: '/manage/system-prompts',
        activePaths: ['/manage/system-prompts'],
    },
];

export const navItems = () => mainNavItems;

export const isPathActive = (currentPath, activePaths = []) =>
    activePaths.some((path) => currentPath === path || currentPath.startsWith(`${path}/`));

const findNavTitle = (items, pathname) => {
    for (const item of items) {
        const activePaths = item.activePaths || (item.path ? [item.path] : []);
        if (item.path && isPathActive(pathname, activePaths)) {
            return item.label;
        }
        if (item.children?.length) {
            const childTitle = findNavTitle(item.children, pathname);
            if (childTitle) return childTitle;
        }
    }
    return '';
};

export const getPageTitle = (pathname) => {
    if (pathname === '/login') return 'Login';
    if (pathname === '/register') return 'Register';
    return findNavTitle(mainNavItems, pathname);
};
