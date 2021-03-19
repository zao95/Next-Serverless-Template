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

const REGION = 'ap-northeast-2'
const DistributionId = process.env.DISTRIBUTION_ID
const bucketParams = {
    Bucket: process.env.S3_BUCKET,
}

const createClient = async () => {
    console.log('createClient Start')
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
    console.log('createClient Complete')
    return [s3, cf]
}

const s3ListRead = async (s3) => {
    console.log('s3ListRead Start')
    try {
        const s3ObjectList = []
        const data = await s3.send(new ListObjectsCommand(bucketParams))
        if (data.Contents) {
            for (let i of data.Contents) {
                s3ObjectList.push(i.Key)
            }
        }
        console.log('s3ListRead Complete')
        return s3ObjectList
    } catch (e) {
        console.log(e)
    }
}

const s3Delete = async (s3, files) => {
    console.log('s3Delete Start')
    const deleteParams = {
        ...bucketParams,
        Delete: { Objects: [] }
    }
    for (let file of files) {
        deleteParams.Delete.Objects.push({ 'Key': file })
    }
    try {
        await s3.send(new DeleteObjectsCommand(deleteParams))
    } catch (err) {
        console.log('Error', err)
    }
    console.log('s3Delete Complete')
}

const s3Upload = async (s3) => {
    console.log('s3Upload Start')
    const files = glob.sync(`./out/**/*.*`)
    for (let file of files) {
        const uploadParams = { ...bucketParams }
        const body = fs.readFileSync(file)
        uploadParams['Key'] = file.replace('./out/', '')
        uploadParams['ACL'] = 'public-read'
        uploadParams['Body'] = body
        if (file.match(/\.html$/)) {
            uploadParams['ContentType'] = 'text/html'
            if (!(file.match(/^\.\/out\/404\.html/) || file.match(/^\.\/out\/index\.html/))) {
                uploadParams['Key'] = uploadParams['Key'].replace('.html', '')
            }
        }

        try {
            await s3.send(new PutObjectCommand(uploadParams))
        } catch (err) {
            console.log('Error', err)
        }
    }
    console.log('s3Upload Complete')
}

const cfInvalidation = async (cf) => {
    console.log('cfInvalidation Start')
    await cf.send(new CreateInvalidationCommand({
        DistributionId,
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
    console.log('cfInvalidation Complete')
}

const deploy = async () => {
    try {
        const [s3, cf] = await createClient()
        const s3List = await s3ListRead(s3)
        s3List?.Contents?.length && await s3Delete(s3, s3List)
        await s3Upload(s3)
        await cfInvalidation(cf)
    } catch (e) {
        console.log(e)
        throw new Error(e)
    }
}

deploy()
