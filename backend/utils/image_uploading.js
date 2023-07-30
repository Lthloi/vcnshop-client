import cloudinary from 'cloudinary'
import BaseError from './base_error.js'

const get_data_uri = (mimetype, data) => `data:${mimetype};base64,${data.toString('base64')}`

const uploadOneImage = async (image_to_upload, public_id, folder_of_uploading) => {
    //delete the old avatar before upload
    await cloudinary.v2.api.delete_resources_by_prefix(folder_of_uploading)

    let data_uri = get_data_uri(image_to_upload.mimetype, image_to_upload.data)

    let options = { folder: folder_of_uploading }
    if (public_id) options.public_id = public_id
    else options.use_filename = true

    let response = await cloudinary.v2.uploader.upload(
        data_uri,
        options
    )

    return response.secure_url
}

const uploadImages = async (images_to_upload, folder_of_uploading) => {
    //delete the old images before upload

    await cloudinary.v2.api.delete_resources_by_prefix(folder_of_uploading)

    if (!images_to_upload) throw new BaseError()

    //check if files is iterable
    if (!Array.isArray(images_to_upload))
        images_to_upload = [images_to_upload]

    let data_uri
    let image_urls = await Promise.all(
        images_to_upload.map(({ data, mimetype }) => {
            data_uri = get_data_uri(mimetype, data)
            return cloudinary.v2.uploader.upload(
                data_uri,
                {
                    use_filename: true,
                    unique_filename: true,
                    folder: folder_of_uploading,
                },
            )
        })
    )

    image_urls = image_urls.map(({ secure_url }) => secure_url)

    return image_urls
}

const uploadUserAvatar = async (image_to_upload, user_id) => {
    let public_id = 'avatar.' + image_to_upload.mimetype.split('/')[0]
    let folder_of_uploading = 'users/' + user_id + '/profile'

    return await uploadOneImage(image_to_upload, public_id, folder_of_uploading)
}

const uploadReviewImages = async (images_to_upload, product_id, user_id) => {
    let folder_of_uploading = 'products/' + product_id + '/reviews/' + user_id

    return await uploadImages(images_to_upload, folder_of_uploading)
}

const uploadProductImages = async (images_to_upload, product_id) => {
    let folder_of_uploading = 'products/' + product_id + '/product_images'

    return await uploadImages(images_to_upload, folder_of_uploading)
}

export {
    uploadReviewImages, uploadUserAvatar, uploadProductImages,
} 