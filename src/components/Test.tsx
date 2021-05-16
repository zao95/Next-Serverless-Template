import React, { useContext, useEffect } from 'react'
import { StoreProvider, useStore } from '../context/TestContext'
import A from './A'
import B from './B'

const Test = () => {
    const { storedData, onStoreData } = useStore()
    return (
        <>
            { storedData.page === 'A' ? <A /> : storedData.page === 'B' && <B /> }
        </>
    )
}

export default Test