import Link from 'next/link'
import Head from 'next/head'
import React from 'react'
import styled from 'styled-components'
import palette from '../styles/palette'
import Setting from '../utils/setting'
import Test from '../components/Test'
import { StoreProvider } from '../context/TestContext'

const Container = styled.div`
    color: ${palette.gray};
`

const index: React.FC = () => {
    return (
        <>
            <Head>
                <title>TEST : {Setting.title}</title>
                <meta property="og:title" key="title" content={Setting.title} />
            </Head>
            <Container>
                <p><Link href='/'>go to home</Link></p>
                <StoreProvider>
                    <Test />
                </StoreProvider>
            </Container>
        </>
    )
}

export default index
