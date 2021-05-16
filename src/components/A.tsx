import React from 'react'
import styled from 'styled-components'
import { useStore } from '../context/TestContext'

const Container = styled.div`
    padding: 16px;
    margin: 16px;
    background-color: rgba(0, 0, 0, 0.04);
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.26);
    border-radius: 32px;
`

const A = () => {
    const { storedData, onStoreData } = useStore()
    const handleClick = (e) => {
        onStoreData({page: 'B'})
    }
    return (
        <Container>
            <div>AAA</div>
            <button onClick={handleClick}>go to B</button>
        </Container>
    )
}

export default A