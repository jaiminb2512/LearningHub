import { createContext, useContext } from 'react';

export const HeaderActionsContext = createContext({
    headerActions: null,
    setHeaderActions: () => {}
});
export const useHeaderActions = () => useContext(HeaderActionsContext);
