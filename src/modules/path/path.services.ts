import { Types } from "mongoose"
import { Path } from "./path.model"

export const createPath = async (userId: Types.ObjectId,name:string, path: any) => {

  await Path.create({ userId, name, path })

}
export const getAllPath = async (userId: Types.ObjectId) => {
    const allPath = await Path.find({userId})
     return allPath
}

export const getPathById = async (id: Types.ObjectId) => {
    const allPath = await Path.findOne({_id: id})
    console.log(allPath)
     return allPath
}


export const getPathAllByUserId = async (id: Types.ObjectId) => {
    const allPath = await Path.find({userId: id})
    return allPath
}



export const deletePathService = async (userId: Types.ObjectId,pathId:Types.ObjectId) => {
    const allPath = await Path.findOneAndDelete({userId, _id:pathId})
    return allPath
}


