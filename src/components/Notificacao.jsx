function Notificacao({ mensagem, tipo }) {
  if (!mensagem) {
    return null
  }

  return (
    <div className={`notificacao ${tipo}`}>
      {mensagem}
    </div>
  )
}

export default Notificacao