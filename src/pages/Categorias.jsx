import { useEffect, useState } from 'react'
import api from '../services/api'
import Notificacao from '../components/Notificacao'

function Categorias() {
  const [categorias, setCategorias] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [busca, setBusca] = useState('')

  const [notificacao, setNotificacao] = useState({
    mensagem: '',
    tipo: ''
  })

  useEffect(() => {
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

  function abrirNovaCategoria() {
    setCategoriaEditando(null)
    setNomeCategoria('')
    setMostrarModal(true)
  }

  function abrirEdicao(categoria) {
    setCategoriaEditando(categoria)
    setNomeCategoria(categoria.nome)
    setMostrarModal(true)
  }

  function fecharModal() {
    setMostrarModal(false)
    setCategoriaEditando(null)
    setNomeCategoria('')
  }

  async function salvarCategoria(evento) {
    evento.preventDefault()

    const nomeLimpo = nomeCategoria.trim()

    const duplicada = categorias.some((categoria) => {
      const mesmoNome =
        categoria.nome.toLowerCase() === nomeLimpo.toLowerCase()

      const outroId =
        !categoriaEditando ||
        categoria.id !== categoriaEditando.id

      return mesmoNome && outroId
    })

    if (duplicada) {
      mostrarNotificacao(
        'Já existe uma categoria com esse nome.',
        'erro'
      )

      return
    }

    try {
      if (categoriaEditando) {
        await api.put(
          `/categorias-despesa/${categoriaEditando.id}`,
          {
            nome: nomeLimpo
          }
        )
      } else {
        await api.post('/categorias-despesa', {
          nome: nomeLimpo
        })
      }

      fecharModal()
      await buscarCategorias()

      mostrarNotificacao(
        categoriaEditando
          ? 'Categoria atualizada com sucesso.'
          : 'Categoria cadastrada com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível salvar a categoria.',
        'erro'
      )
    }
  }

  async function excluirCategoria(categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.nome}"?`
    )

    if (!confirmar) {
      return
    }

    try {
      await api.delete(
        `/categorias-despesa/${categoria.id}`
      )

      await buscarCategorias()

      mostrarNotificacao(
        'Categoria excluída com sucesso.',
        'sucesso'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível excluir esta categoria. Ela pode estar sendo usada em alguma despesa.',
        'erro'
      )
    }
  }

  const categoriasFiltradas = categorias.filter(
    (categoria) =>
      categoria.nome
        .toLowerCase()
        .includes(busca.toLowerCase())
  )

  return (
    <div>
      <Notificacao
        mensagem={notificacao.mensagem}
        tipo={notificacao.tipo}
      />

      <div className="topo">
        <div>
          <h1>Categorias</h1>
          <p>Organize as categorias utilizadas nas despesas</p>
        </div>

        <button
          className="botao-principal"
          onClick={abrirNovaCategoria}
        >
          + Nova categoria
        </button>
      </div>

      <div className="secao filtros-container">
        <div className="secao-topo">
          <div>
            <h2>Pesquisar</h2>
            <p>Encontre rapidamente uma categoria</p>
          </div>
        </div>

        <div className="filtros-grid">
          <div className="campo">
            <label>Nome</label>

            <input
              type="text"
              placeholder="Pesquisar categoria..."
              value={busca}
              onChange={(evento) =>
                setBusca(evento.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>Categorias cadastradas</h2>

            <p>
              {categoriasFiltradas.length} categoria(s) encontrada(s)
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {categoriasFiltradas.map((categoria) => (
              <tr key={categoria.id}>
                <td>{categoria.id}</td>
                <td>{categoria.nome}</td>

                <td>
                  <div className="acoes-tabela">
                    <button
                      className="botao-editar"
                      onClick={() =>
                        abrirEdicao(categoria)
                      }
                    >
                      Editar
                    </button>

                    <button
                      className="botao-excluir"
                      onClick={() =>
                        excluirCategoria(categoria)
                      }
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categoriasFiltradas.length === 0 && (
          <div className="sem-resultados">
            Nenhuma categoria encontrada.
          </div>
        )}
      </div>

      {mostrarModal && (
        <div className="modal-fundo">
          <div className="modal">

            <div className="modal-topo">
              <div>
                <h2>
                  {categoriaEditando
                    ? 'Editar categoria'
                    : 'Nova categoria'}
                </h2>

                <p>
                  {categoriaEditando
                    ? 'Altere o nome da categoria'
                    : 'Cadastre uma nova categoria de despesa'}
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
              onSubmit={salvarCategoria}
              className="formulario"
            >
              <div className="campo campo-grande">
                <label>Nome da categoria</label>

                <input
                  type="text"
                  value={nomeCategoria}
                  onChange={(evento) =>
                    setNomeCategoria(evento.target.value)
                  }
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
                  {categoriaEditando
                    ? 'Salvar alterações'
                    : 'Salvar categoria'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default Categorias