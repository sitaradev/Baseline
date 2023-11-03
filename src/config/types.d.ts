export interface UserInfo {
  [key: string]:{
    mode: string,
    currentStage: string,
    voice_id?: string
  }
}