import { useEffect, useState } from 'react'
import api from '../services/api'
import Notificacao from '../components/Notificacao'

function Entradas() {
  const [entradas, setEntradas] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [entradaEditando, setEntradaEditando] = useState(null)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [notificacao, setNotificacao] = useState({
    mensagem: '',
    tipo: ''
  })

  const itensPorPagina = 10

  const [filtros, setFiltros] = useState({
    busca: '',
    formaPagamento: '',
    dataInicio: '',
    dataFim: ''
  })

  const formularioVazio = {
    valor: '',
    data: '',
    formaPagamento: 'PIX',
    descricao: ''
  }

  const [formulario, setFormulario] = useState(formularioVazio)

  useEffect(() => {
    buscarEntradas()
  }, [])

  function mostrarNotificacao(mensagem, tipo) {
    setNotificacao({
      mensagem,
      tipo
    })

    setTimeout(() => {
      setNotificacao({
        mensagem: '',
        tipo: ''
      })
    }, 3000)
  }

  async function buscarEntradas() {
    try {
      const resposta = await api.get('/entradas')
      setEntradas(resposta.data)
    } catch {
      mostrarNotificacao(
        'Não foi possível carregar as entradas.',
        'erro'
      )
    }
  }

  function atualizarCampo(evento) {
    const { name, value } = evento.target

    setFormulario({
      ...formulario,
      [name]: value
    })
  }

  function atualizarFiltro(evento) {
    const { name, value } = evento.target

    setFiltros({
      ...filtros,
      [name]: value
    })

    setPaginaAtual(1)
  }

  function limparFiltros() {
    setFiltros({
      busca: '',
      formaPagamento: '',
      dataInicio: '',
      dataFim: ''
    })

    setPaginaAtual(1)
  }

  function abrirNovaEntrada() {
    setEntradaEditando(null)
    setFormulario(formularioVazio)
    setMostrarModal(true)
  }

  function abrirEdicao(entrada) {
    setEntradaEditando(entrada)

    setFormulario({
      valor: entrada.valor,
      data: entrada.data,
      formaPagamento: entrada.formaPagamento,
      descricao: entrada.descricao || ''
    })

    setMostrarModal(true)
  }

  function fecharModal() {
    setMostrarModal(false)
    setEntradaEditando(null)
    setFormulario(formularioVazio)
  }

  async function salvarEntrada(evento) {
    evento.preventDefault()

    const editando = Boolean(entradaEditando)

    const dados = {
      valor: Number(formulario.valor),
      data: formulario.data,
      formaPagamento: formulario.formaPagamento,
      descricao: formulario.descricao,
      empresa: {
        id: 1
      }
    }

    try {
      if (editando) {
        await api.put(`/entradas/${entradaEditando.id}`, dados)
      } else {
        await api.post('/entradas', dados)
      }

      fecharModal()
      await buscarEntradas()

      mostrarNotificacao(
        editando
          ? 'Entrada atualizada com sucesso.'
          : 'Entrada cadastrada com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível salvar a entrada.',
        'erro'
      )
    }
  }

  async function excluirEntrada(entrada) {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${entrada.descricao || 'esta entrada'}"?`
    )

    if (!confirmar) {
      return
    }

    try {
      await api.delete(`/entradas/${entrada.id}`)
      await buscarEntradas()

      mostrarNotificacao(
        'Entrada excluída com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível excluir a entrada.',
        'erro'
      )
    }
  }

  const entradasFiltradas = entradas.filter((entrada) => {
    const descricao = entrada.descricao?.toLowerCase() || ''
    const busca = filtros.busca.toLowerCase()

    const correspondeBusca =
      !filtros.busca || descricao.includes(busca)

    const correspondePagamento =
      !filtros.formaPagamento ||
      entrada.formaPagamento === filtros.formaPagamento

    const correspondeInicio =
      !filtros.dataInicio ||
      entrada.data >= filtros.dataInicio

    const correspondeFim =
      !filtros.dataFim ||
      entrada.data <= filtros.dataFim

    return (
      correspondeBusca &&
      correspondePagamento &&
      correspondeInicio &&
      correspondeFim
    )
  })

  const totalPaginas = Math.max(
    1,
    Math.ceil(entradasFiltradas.length / itensPorPagina)
  )

  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina

  const entradasPaginadas = entradasFiltradas.slice(
    indiceInicial,
    indiceFinal
  )

  function paginaAnterior() {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1)
    }
  }

  function proximaPagina() {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1)
    }
  }

  function formatarDinheiro(valor) {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarData(data) {
    if (!data) {
      return ''
    }

    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <div>
      <Notificacao
        mensagem={notificacao.mensagem}
        tipo={notificacao.tipo}
      />

      <div className="topo">
        <div>
          <h1>Entradas</h1>
          <p>Gerencie as entradas financeiras da empresa</p>
        </div>

        <button
          className="botao-principal"
          onClick={abrirNovaEntrada}
        >
          + Nova entrada
        </button>
      </div>

      <div className="secao filtros-container">
        <div className="secao-topo">
          <div>
            <h2>Filtros</h2>
            <p>Encontre rapidamente os lançamentos desejados</p>
          </div>

          <button
            className="botao-limpar"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>

        <div className="filtros-grid">
          <div className="campo">
            <label>Pesquisar</label>

            <input
              type="text"
              name="busca"
              placeholder="Pesquisar descrição..."
              value={filtros.busca}
              onChange={atualizarFiltro}
            />
          </div>

          <div className="campo">
            <label>Forma de pagamento</label>

            <select
              name="formaPagamento"
              value={filtros.formaPagamento}
              onChange={atualizarFiltro}
            >
              <option value="">Todas</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="DEBITO">Débito</option>
              <option value="CREDITO">Crédito</option>
              <option value="OUTRAS">Outras</option>
            </select>
          </div>

          <div className="campo">
            <label>Data inicial</label>

            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={atualizarFiltro}
            />
          </div>

          <div className="campo">
            <label>Data final</label>

            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={atualizarFiltro}
            />
          </div>
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>Entradas registradas</h2>
            <p>{entradasFiltradas.length} lançamento(s) encontrado(s)</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Forma de pagamento</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {entradasPaginadas.map((entrada) => (
              <tr key={entrada.id}>
                <td>{formatarData(entrada.data)}</td>
                <td>{entrada.descricao || '-'}</td>
                <td>{entrada.formaPagamento}</td>

                <td className="valor-entrada">
                  {formatarDinheiro(entrada.valor)}
                </td>

                <td>
                  <div className="acoes-tabela">
                    <button
                      className="botao-editar"
                      onClick={() => abrirEdicao(entrada)}
                    >
                      Editar
                    </button>

                    <button
                      className="botao-excluir"
                      onClick={() => excluirEntrada(entrada)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {entradasFiltradas.length === 0 ? (
          <div className="sem-resultados">
            Nenhuma entrada encontrada.
          </div>
        ) : (
          <div className="paginacao">
            <button
              className="botao-paginacao"
              onClick={paginaAnterior}
              disabled={paginaAtual === 1}
            >
              ← Anterior
            </button>

            <div className="paginacao-info">
              <span>Página</span>
              <strong>{paginaAtual}</strong>
              <span>de</span>
              <strong>{totalPaginas}</strong>
            </div>

            <button
              className="botao-paginacao"
              onClick={proximaPagina}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-fundo">
          <div className="modal">
            <div className="modal-topo">
              <div>
                <h2>
                  {entradaEditando
                    ? 'Editar entrada'
                    : 'Nova entrada'}
                </h2>

                <p>
                  {entradaEditando
                    ? 'Altere os dados do lançamento'
                    : 'Preencha os dados do lançamento'}
                </p>
              </div>

              <button
                type="button"
                className="modal-fechar"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={salvarEntrada}
              className="formulario"
            >
              <div className="campo">
                <label>Valor</label>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="valor"
                  value={formulario.valor}
                  onChange={atualizarCampo}
                  required
                />
              </div>

              <div className="campo">
                <label>Data</label>

                <input
                  type="date"
                  name="data"
                  value={formulario.data}
                  onChange={atualizarCampo}
                  required
                />
              </div>

              <div className="campo">
                <label>Forma de pagamento</label>

                <select
                  name="formaPagamento"
                  value={formulario.formaPagamento}
                  onChange={atualizarCampo}
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                  <option value="OUTRAS">Outras</option>
                </select>
              </div>

              <div className="campo">
                <label>Descrição</label>

                <input
                  type="text"
                  name="descricao"
                  value={formulario.descricao}
                  onChange={atualizarCampo}
                  required
                />
              </div>

              <div className="acoes-formulario">
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="botao-principal"
                >
                  {entradaEditando
                    ? 'Salvar alterações'
                    : 'Salvar entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Entradas