import React from 'react'
import Head from 'next/head'
import setting from '@utils/setting'

const error = () => {
    return (
        <>
            <Head>
                <title>페이지를 찾을 수 없습니다. | {setting.title}</title>
            </Head>
            <p>에러가 발생했습니다.</p>
        </>
    )
}

export default error
