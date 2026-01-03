//src/types/notification.ts

export type NotificationType =
  | 'revenue'
  | 'risk'
  | 'action'
  | 'system'

export type Notification = {
  id: string
  clientId: string
  type: NotificationType
  title: string
  description?: string
  value?: number
  createdAt: string
}
