const {
    S3Client,
    PutObjectCommand,
    ListObjectsCommand,
    DeleteObjectsCommand,
} = require('@aws-sdk/client-s3')
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront')
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
    const s3 = new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID.replace(" ", ""),
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.replace(" ", ""),
        },
    })
    const cf = new CloudFrontClient({
        region: REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID.replace(" ", ""),
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.replace(" ", ""),
        }
    })
    return [s3, cf]
}

const s3ListRead = async (s3) => {
    const s3ObjectList = []
    const data = await s3.send(new ListObjectsCommand(appBucket))
    if (data.Contents) {
        for (let i of data.Contents) {
            s3ObjectList.push(i.Key)
        }
    }
    return s3ObjectList
}

const s3Delete = async (s3, files) => {
    const deleteParams = {
        ...appBucket,
        Delete: { Objects: [] }
    }
    for (let file of files) {
        deleteParams.Delete.Objects.push({ 'Key': file })
    }
    await s3.send(new DeleteObjectsCommand(deleteParams))
}

const s3AppUpload = async (s3) => {
    const files = glob.sync(`./out/**/*.*`)
    for (let file of files) {
        if (file.match(/\.stories\.tsx$/)) {
            continue
        }
        const uploadParams = { ...appBucket }
        const body = fs.readFileSync(file)
        uploadParams['Key'] = file.replace('./out/', '')
        uploadParams['ACL'] = 'public-read'
        uploadParams['Body'] = body
        uploadParams['CacheControl'] = 'max-age=604800,public'
        if (file.match(/\.html$/)) {
            uploadParams['ContentType'] = 'text/html'
            uploadParams['CacheControl'] = 'no-cache, no-store, must-revalidate'
            if (!(file.match(/^\.\/out\/404\.html/) || file.match(/^\.\/out\/index\.html/))) {
                uploadParams['Key'] = uploadParams['Key'].replace('.html', '')
            }
        }

        await s3.send(new PutObjectCommand(uploadParams))
    }
}

const cfAppInvalidation = async (cf) => {
    await cf.send(new CreateInvalidationCommand({
        DistributionId: appDistributionId,
        InvalidationBatch: {
            CallerReference: String(md5(new Date().toString())),
            Paths: {
                Items: [
                    '/*',
                ],
                Quantity: 1,
            },
        }
    }))
}

const cfStorybookInvalidation = async (cf) => {
    await cf.send(new CreateInvalidationCommand({
        DistributionId: storybookDistributionId,
        InvalidationBatch: {
            CallerReference: String(md5(new Date().toString())),
            Paths: {
                Items: [
                    '/*',
                ],
                Quantity: 1,
            },
        }
    }))
}

const s3StorybookUpload = async (s3) => {
    const files = glob.sync(`./storybook-static/**/*.*`)
    for (let file of files) {
        const uploadParams = { ...storybookBucket }
        const body = fs.readFileSync(file)
        uploadParams['Key'] = file.replace('./storybook-static/', `${storybookUrl}/`)
        uploadParams['Body'] = body
        uploadParams['CacheControl'] = 'max-age=604800,public'
        if (file.match(/\.html$/)) {
            uploadParams['ContentType'] = 'text/html'
            uploadParams['CacheControl'] = 'no-cache, no-store, must-revalidate'
            if (file.match(/index\.html$/)) {
                uploadParams['Key'] = uploadParams['Key'].replace('index.html', 'storybook')
            } else if (file.match(/iframe\.html$/)) {
                uploadParams['ContentDisposition'] = 'inline'
            }
        }

        await s3.send(new PutObjectCommand(uploadParams))
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
        throw Error(e)
    } finally {
        time()
    }
}


const deploy = async () => {
    try {
        const [s3, cf] = await loadProcess('createClient', createClient)
        // await loadProcess('s3ListRead', s3ListRead, [s3])
        // await loadProcess('s3Delete', s3Delete, [s3, s3List])
        await loadProcess('s3AppUpload', s3AppUpload, [s3])
        await loadProcess('cfAppInvalidation', cfAppInvalidation, [cf])
        await loadProcess('s3StorybookUpload', s3StorybookUpload, [s3])
        await loadProcess('cfStorybookInvalidation', cfStorybookInvalidation, [cf])
    } catch (e) {
        process.stdout.write(e)
        throw new Error(e)
    }
}

deploy()
