export default (dateString: string): Date => {
  return new Date(`${dateString} 00:00:00`)
}
