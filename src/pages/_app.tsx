import GlobalStyle from '@styles/GlobalStyle'
import { AppProps } from 'next/app'
import { SWRConfig } from 'swr'
import { wrapper } from '../redux/store'
import Head from 'next/head'

const app = ({ Component, pageProps }: AppProps) => {
    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
                />
            </Head>
            <GlobalStyle />
            <Component {...pageProps} />
        </>
    )
}

export default wrapper.withRedux(app)
