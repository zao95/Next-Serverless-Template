const {
    S3Client,
    PutObjectCommand,
    ListObjectsCommand,
    DeleteObjectsCommand,
} = require('@aws-sdk/client-s3')
const {
    CloudFrontClient,
    CreateInvalidationCommand,
} = require('@aws-sdk/client-cloudfront')
const fs = require('fs')
const glob = require('glob')
const md5 = require('md5')

const storybookUrl = 'm'
const REGION = 'ap-northeast-2'
const appDistributionId = process.env.APP_DISTRIBUTION_ID
const appBucket = {
    Bucket: process.env.APP_S3_BUCKET,
}
const storybookDistributionId = process.env.STORYBOOK_DISTRIBUTION_ID
const storybookBucket = {
    Bucket: process.env.STORYBOOK_S3_BUCKET,
}

const createClient = async () => {
    try {
        const s3 = new S3Client({
            region: REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID.replace(' ', ''),
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.replace(
                    ' ',
                    ''
                ),
            },
        })
        const cf = new CloudFrontClient({
            region: REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID.replace(' ', ''),
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.replace(
                    ' ',
                    ''
                ),
            },
        })
        return [s3, cf]
    } catch (e) {
        throw new Error(e)
    }
}

const s3AppListRead = async (s3) => {
    try {
        const s3ObjectList = []
        const data = await s3.send(new ListObjectsCommand(appBucket))
        if (data.Contents) {
            for (let i of data.Contents) {
                s3ObjectList.push(i.Key)
            }
        }
        return s3ObjectList
    } catch (e) {
        throw new Error(e)
    }
}

const s3AppDelete = async (s3, files) => {
    try {
        const deleteParams = {
            ...appBucket,
            Delete: { Objects: [] },
        }
        for (let file of files) {
            deleteParams.Delete.Objects.push({ Key: file })
        }
        await s3.send(new DeleteObjectsCommand(deleteParams))
    } catch (e) {
        throw new Error(e)
    }
}

const s3AppUpload = async (s3) => {
    try {
        const files = glob.sync(`./out/**/*.*`)
        for (let file of files) {
            if (file.match(/(\.md|\.stories\.tsx)$/)) continue
            const uploadParams = { ...appBucket }
            const body = fs.readFileSync(file)
            uploadParams['Key'] = file.replace('./out/', '')
            uploadParams['Body'] = body
            uploadParams['CacheControl'] = 'max-age=604800,public'
            if (file.match(/\.html$/)) {
                uploadParams['ContentType'] = 'text/html'
                uploadParams['CacheControl'] =
                    'no-cache, no-store, must-revalidate'
                if (
                    !(
                        file.match(/^\.\/out\/404\.html/) ||
                        file.match(/^\.\/out\/index\.html/)
                    )
                ) {
                    uploadParams['Key'] = uploadParams['Key'].replace(
                        '.html',
                        ''
                    )
                }
            }
            if (file.match(/\.eot$/)) {
                uploadParams['ContentType'] = 'application/vnd.ms-fontobject'
            }
            if (file.match(/\.ttf$/)) {
                uploadParams['ContentType'] = 'application/x-font-ttf'
            }
            if (file.match(/\.woff$/)) {
                uploadParams['ContentType'] = 'application/x-font-woff'
            }
            if (file.match(/\.woff2$/)) {
                uploadParams['ContentType'] = 'font/woff2'
            }
            if (file.match(/\.css$/)) {
                uploadParams['ContentType'] = 'text/css'
            }

            await s3.send(new PutObjectCommand(uploadParams))
        }
    } catch (e) {
        throw new Error(e)
    }
}

const cfAppInvalidation = async (cf) => {
    try {
        await cf.send(
            new CreateInvalidationCommand({
                DistributionId: appDistributionId,
                InvalidationBatch: {
                    CallerReference: String(md5(new Date().toString())),
                    Paths: {
                        Items: ['/*'],
                        Quantity: 1,
                    },
                },
            })
        )
    } catch (e) {
        throw new Error(e)
    }
}

const timer = () => {
    const timer = setInterval(() => {
        process.stdout.write('.')
    }, 100)
    const clearTimer = () => {
        clearInterval(timer)
    }
    return clearTimer
}

const loadProcess = async (name, func, params = []) => {
    const time = timer()
    process.stdout.write(`${name} start...`)
    try {
        const result = await func(...params)
        process.stdout.write(`complete\n`)
        return result
    } catch (e) {
        process.stdout.write(`error\n`)
        return Promise.reject(Error(e))
    } finally {
        time()
    }
}

const deploy = async () => {
    try {
        const [s3, cf] = await loadProcess('createClient', createClient)

        // App S3 reset
        // const s3AppObjectList = await loadProcess(
        //     's3AppListRead',
        //     s3AppListRead,
        //     [s3]
        // )
        // await loadProcess('s3AppDelete', s3AppDelete, [s3, s3AppObjectList])

        // App deploy
        await loadProcess('s3AppUpload', s3AppUpload, [s3])
        await loadProcess('cfAppInvalidation', cfAppInvalidation, [cf])
    } catch (e) {
        process.stdout.write(e)
        process.exit(1)
    }
}

deploy()
