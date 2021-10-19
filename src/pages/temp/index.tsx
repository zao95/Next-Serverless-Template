import setting from '@utils/setting'
import Head from 'next/head'

const temp = () => (
    <>
        <Head>
            <title>인트로 | {setting.title}</title>
        </Head>
        <p>temp</p>
    </>
)

export default temp
