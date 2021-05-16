import { createContext, useContext, useState } from 'react'
//TODO: reducer 패턴으로 변경?
const testContextDefaultValues = {
    storedData: null,
    onStoreData: (arg: object) => {},
    onResetData: () => {},
}

const StoreContext = createContext(testContextDefaultValues)

export function useStore() {
    return useContext(StoreContext)
}

const initialValue = {
    page: 'A'
}

export function StoreProvider({ children }) {
    const [storedData, setCapturedData] = useState(initialValue)

    const onStoreData = (arg: object) => {
        setCapturedData(state => ({...state, ...arg}))
    }

    const onResetData = () => {
        setCapturedData(null)
    }

    const value = {
        storedData,
        onStoreData,
        onResetData,
    }

    return (
        <>
            <StoreContext.Provider value={value}>
                {children}
            </StoreContext.Provider>
        </>
    )
}
