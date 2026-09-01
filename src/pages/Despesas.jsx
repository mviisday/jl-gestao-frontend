import { useEffect, useState } from 'react'
import api from '../services/api'
import Notificacao from '../components/Notificacao'

function Despesas() {
  const [despesas, setDespesas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [despesaEditando, setDespesaEditando] = useState(null)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const [notificacao, setNotificacao] = useState({
    mensagem: '',
    tipo: ''
  })

  const itensPorPagina = 10

  const [filtros, setFiltros] = useState({
    busca: '',
    categoria: '',
    status: '',
    formaPagamento: '',
    dataInicio: '',
    dataFim: ''
  })

  const formularioVazio = {
    valor: '',
    data: '',
    formaPagamento: 'PIX',
    descricao: '',
    status: 'PAGA',
    categoriaId: ''
  }

  const [formulario, setFormulario] = useState(formularioVazio)

  useEffect(() => {
  const parametros =
    new URLSearchParams(
      window.location.search
    )

  const statusUrl =
    parametros.get('status')

  if (
    statusUrl === 'PENDENTE' ||
    statusUrl === 'PAGA'
  ) {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      status: statusUrl
    }))
  }

  buscarDespesas()
  buscarCategorias()
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

  async function buscarDespesas() {
    try {
      const resposta = await api.get('/despesas')
      setDespesas(resposta.data)
    } catch {
      mostrarNotificacao(
        'Não foi possível carregar as despesas.',
        'erro'
      )
    }
  }

  async function buscarCategorias() {
    try {
      const resposta = await api.get('/categorias-despesa')
      setCategorias(resposta.data)
    } catch {
      mostrarNotificacao(
        'Não foi possível carregar as categorias.',
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
      categoria: '',
      status: '',
      formaPagamento: '',
      dataInicio: '',
      dataFim: ''
    })

    setPaginaAtual(1)
  }

  function abrirNovaDespesa() {
    setDespesaEditando(null)
    setFormulario(formularioVazio)
    setMostrarModal(true)
  }

  function abrirEdicao(despesa) {
    setDespesaEditando(despesa)

    setFormulario({
      valor: despesa.valor,
      data: despesa.data,
      formaPagamento: despesa.formaPagamento,
      descricao: despesa.descricao || '',
      status: despesa.status || 'PAGA',
      categoriaId: despesa.categoria?.id || ''
    })

    setMostrarModal(true)
  }

  function fecharModal() {
    setMostrarModal(false)
    setDespesaEditando(null)
    setFormulario(formularioVazio)
  }

  async function salvarDespesa(evento) {
    evento.preventDefault()

    const editando = Boolean(despesaEditando)

    const dados = {
      valor: Number(formulario.valor),
      data: formulario.data,
      formaPagamento: formulario.formaPagamento,
      descricao: formulario.descricao,
      status: formulario.status,
      empresa: {
        id: 1
      },
      categoria: {
        id: Number(formulario.categoriaId)
      }
    }

    try {
      if (editando) {
        await api.put(`/despesas/${despesaEditando.id}`, dados)
      } else {
        await api.post('/despesas', dados)
      }

      fecharModal()
      await buscarDespesas()

      mostrarNotificacao(
        editando
          ? 'Despesa atualizada com sucesso.'
          : 'Despesa cadastrada com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível salvar a despesa.',
        'erro'
      )
    }
  }

  async function marcarComoPaga(despesa) {
    const confirmar = window.confirm(
      `Deseja marcar "${despesa.descricao || 'esta despesa'}" como paga?`
    )

    if (!confirmar) {
      return
    }

    const dados = {
      valor: Number(despesa.valor),
      data: despesa.data,
      formaPagamento: despesa.formaPagamento,
      descricao: despesa.descricao,
      status: 'PAGA',
      empresa: {
        id: despesa.empresa?.id || 1
      },
      categoria: {
        id: despesa.categoria?.id
      }
    }

    try {
      await api.put(`/despesas/${despesa.id}`, dados)
      await buscarDespesas()

      mostrarNotificacao(
        'Despesa marcada como paga.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível atualizar o status da despesa.',
        'erro'
      )
    }
  }

  async function excluirDespesa(despesa) {
    const confirmar = window.confirm(
      `Deseja realmente excluir "${despesa.descricao || 'esta despesa'}"?`
    )

    if (!confirmar) {
      return
    }

    try {
      await api.delete(`/despesas/${despesa.id}`)
      await buscarDespesas()

      mostrarNotificacao(
        'Despesa excluída com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível excluir a despesa.',
        'erro'
      )
    }
  }

  const despesasFiltradas = despesas.filter((despesa) => {
    const descricao = despesa.descricao?.toLowerCase() || ''
    const busca = filtros.busca.toLowerCase()

    const correspondeBusca =
      !filtros.busca || descricao.includes(busca)

    const correspondeCategoria =
      !filtros.categoria ||
      String(despesa.categoria?.id) === filtros.categoria

    const correspondeStatus =
      !filtros.status ||
      despesa.status === filtros.status

    const correspondePagamento =
      !filtros.formaPagamento ||
      despesa.formaPagamento === filtros.formaPagamento

    const correspondeInicio =
      !filtros.dataInicio ||
      despesa.data >= filtros.dataInicio

    const correspondeFim =
      !filtros.dataFim ||
      despesa.data <= filtros.dataFim

    return (
      correspondeBusca &&
      correspondeCategoria &&
      correspondeStatus &&
      correspondePagamento &&
      correspondeInicio &&
      correspondeFim
    )
  })

  const totalPaginas = Math.max(
    1,
    Math.ceil(despesasFiltradas.length / itensPorPagina)
  )

  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina

  const despesasPaginadas = despesasFiltradas.slice(
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
          <h1>Despesas</h1>
          <p>Gerencie as despesas financeiras da empresa</p>
        </div>

        <button
          className="botao-principal"
          onClick={abrirNovaDespesa}
        >
          + Nova despesa
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
            <label>Categoria</label>

            <select
              name="categoria"
              value={filtros.categoria}
              onChange={atualizarFiltro}
            >
              <option value="">Todas</option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Status</label>

            <select
              name="status"
              value={filtros.status}
              onChange={atualizarFiltro}
            >
              <option value="">Todos</option>
              <option value="PAGA">Paga</option>
              <option value="PENDENTE">Pendente</option>
            </select>
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
            <h2>Despesas registradas</h2>
            <p>
              {despesasFiltradas.length} lançamento(s) encontrado(s)
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Forma de pagamento</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {despesasPaginadas.map((despesa) => (
              <tr key={despesa.id}>
                <td>{formatarData(despesa.data)}</td>
                <td>{despesa.descricao || '-'}</td>
                <td>{despesa.categoria?.nome || '-'}</td>
                <td>{despesa.formaPagamento}</td>

                <td>
                  {despesa.status ? (
                    <span
                      className={
                        despesa.status === 'PAGA'
                          ? 'status-paga'
                          : 'status-pendente'
                      }
                    >
                      {despesa.status}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="valor-despesa">
                  {formatarDinheiro(despesa.valor)}
                </td>

                <td>
                  <div className="acoes-tabela">
                    {despesa.status === 'PENDENTE' && (
                      <button
                        className="botao-pagar"
                        onClick={() => marcarComoPaga(despesa)}
                      >
                        Marcar paga
                      </button>
                    )}

                    <button
                      className="botao-editar"
                      onClick={() => abrirEdicao(despesa)}
                    >
                      Editar
                    </button>

                    <button
                      className="botao-excluir"
                      onClick={() => excluirDespesa(despesa)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {despesasFiltradas.length === 0 ? (
          <div className="sem-resultados">
            Nenhuma despesa encontrada.
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
                  {despesaEditando
                    ? 'Editar despesa'
                    : 'Nova despesa'}
                </h2>

                <p>
                  {despesaEditando
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
              onSubmit={salvarDespesa}
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
                <label>Categoria</label>

                <select
                  name="categoriaId"
                  value={formulario.categoriaId}
                  onChange={atualizarCampo}
                  required
                >
                  <option value="">Selecione</option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id}
                      value={categoria.id}
                    >
                      {categoria.nome}
                    </option>
                  ))}
                </select>
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
                <label>Status</label>

                <select
                  name="status"
                  value={formulario.status}
                  onChange={atualizarCampo}
                >
                  <option value="PAGA">Paga</option>
                  <option value="PENDENTE">Pendente</option>
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
                  {despesaEditando
                    ? 'Salvar alterações'
                    : 'Salvar despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Despesas