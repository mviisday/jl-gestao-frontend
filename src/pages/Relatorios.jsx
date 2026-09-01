import { useEffect, useState } from 'react'
import api from '../services/api'
import Notificacao from '../components/Notificacao'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

function Relatorios() {
  const hoje = new Date()

  const primeiroDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  )

  function formatarDataApi(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')

    return `${ano}-${mes}-${dia}`
  }

  const [inicio, setInicio] = useState(
    formatarDataApi(primeiroDiaMes)
  )

  const [fim, setFim] = useState(
    formatarDataApi(hoje)
  )

  const [dados, setDados] = useState({
    totalEntradas: 0,
    totalDespesas: 0,
    resultado: 0
  })

  const [entradas, setEntradas] = useState([])
  const [despesas, setDespesas] = useState([])

  const [notificacao, setNotificacao] = useState({
    mensagem: '',
    tipo: ''
  })

  useEffect(() => {
    buscarRelatorio()
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

  async function buscarRelatorio() {
    if (!inicio || !fim) {
      mostrarNotificacao(
        'Selecione a data inicial e a data final.',
        'erro'
      )

      return
    }

    if (inicio > fim) {
      mostrarNotificacao(
        'A data inicial não pode ser maior que a data final.',
        'erro'
      )

      return
    }

    try {
      const [
        resultadoResposta,
        entradasResposta,
        despesasResposta
      ] = await Promise.all([
        api.get('/resultado', {
          params: {
            inicio,
            fim
          }
        }),

        api.get('/entradas/periodo', {
          params: {
            inicio,
            fim
          }
        }),

        api.get('/despesas/periodo', {
          params: {
            inicio,
            fim
          }
        })
      ])

      setDados(resultadoResposta.data)
      setEntradas(entradasResposta.data)
      setDespesas(despesasResposta.data)
    } catch {
      mostrarNotificacao(
        'Não foi possível gerar o relatório.',
        'erro'
      )
    }
  }

  function formatarDinheiro(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
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

  function somarPorFormaPagamento(lista) {
    return lista.reduce((resultado, item) => {
      const forma = item.formaPagamento || 'OUTRAS'

      if (!resultado[forma]) {
        resultado[forma] = 0
      }

      resultado[forma] += Number(item.valor)

      return resultado
    }, {})
  }

  function somarPorCategoria(lista) {
    return lista.reduce((resultado, despesa) => {
      const categoria =
        despesa.categoria?.nome || 'Sem categoria'

      if (!resultado[categoria]) {
        resultado[categoria] = 0
      }

      resultado[categoria] += Number(despesa.valor)

      return resultado
    }, {})
  }

  const entradasPorPagamento =
    somarPorFormaPagamento(entradas)

  const despesasPorPagamento =
    somarPorFormaPagamento(despesas)

  const despesasPorCategoria =
    somarPorCategoria(despesas)

  const dadosGraficoResumo = [
    {
      nome: 'Entradas',
      valor: Number(dados.totalEntradas),
      fill: '#22c55e'
    },
    {
      nome: 'Despesas',
      valor: Number(dados.totalDespesas),
      fill: '#ef4444'
    }
  ]

  const dadosGraficoCategorias =
    Object.entries(despesasPorCategoria).map(
      ([categoria, valor]) => ({
        nome: categoria,
        valor: Number(valor)
      })
    )

  const totalCategorias =
    dadosGraficoCategorias.reduce(
      (total, item) => total + item.valor,
      0
    )

  const coresGrafico = [
    '#2563eb',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#64748b'
  ]

  const movimentacoes = [
    ...entradas.map((entrada) => ({
      id: `entrada-${entrada.id}`,
      tipo: 'Entrada',
      descricao: entrada.descricao,
      data: entrada.data,
      valor: entrada.valor
    })),

    ...despesas.map((despesa) => ({
      id: `despesa-${despesa.id}`,
      tipo: 'Despesa',
      descricao: despesa.descricao,
      data: despesa.data,
      valor: despesa.valor
    }))
  ].sort((a, b) =>
    b.data.localeCompare(a.data)
  )

  function labelPizza({ value }) {
    if (!totalCategorias) {
      return ''
    }

    const porcentagem =
      (Number(value) / totalCategorias) * 100

    if (porcentagem < 7) {
      return ''
    }

    return `${porcentagem.toFixed(0)}%`
  }

  return (
    <div>
      <Notificacao
        mensagem={notificacao.mensagem}
        tipo={notificacao.tipo}
      />

      <div className="topo">
        <div>
          <h1>Relatórios</h1>
          <p>Analise o desempenho financeiro da empresa</p>
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>Selecionar período</h2>
            <p>
              Escolha as datas para consultar os resultados
            </p>
          </div>
        </div>

        <div className="formulario">
          <div className="campo">
            <label>Data inicial</label>

            <input
              type="date"
              value={inicio}
              onChange={(evento) =>
                setInicio(evento.target.value)
              }
            />
          </div>

          <div className="campo">
            <label>Data final</label>

            <input
              type="date"
              value={fim}
              onChange={(evento) =>
                setFim(evento.target.value)
              }
            />
          </div>

          <div className="acoes-formulario">
            <button
              type="button"
              className="botao-principal"
              onClick={buscarRelatorio}
            >
              Gerar relatório
            </button>
          </div>
        </div>
      </div>

      <div className="cards">
        <div className="card card-entrada">
          <span className="card-titulo">
            Total de entradas
          </span>

          <strong>
            {formatarDinheiro(
              dados.totalEntradas
            )}
          </strong>

          <small>No período selecionado</small>
        </div>

        <div className="card card-despesa">
          <span className="card-titulo">
            Total de despesas
          </span>

          <strong>
            {formatarDinheiro(
              dados.totalDespesas
            )}
          </strong>

          <small>No período selecionado</small>
        </div>

        <div className="card card-resultado">
          <span className="card-titulo">
            Resultado
          </span>

          <strong>
            {formatarDinheiro(
              dados.resultado
            )}
          </strong>

          <small>
            {dados.resultado >= 0
              ? 'Saldo positivo'
              : 'Saldo negativo'}
          </small>
        </div>
      </div>

      <div className="graficos-grid">
        <div className="secao grafico-card">
          <div className="secao-topo">
            <div>
              <h2>Entradas x Despesas</h2>
              <p>Comparação financeira do período</p>
            </div>
          </div>

          <div className="grafico-container">
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={dadosGraficoResumo}
                margin={{
                  top: 15,
                  right: 15,
                  left: 0,
                  bottom: 0
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="nome"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: 'rgba(15, 23, 42, 0.03)'
                  }}
                  formatter={(valor) => [
                    formatarDinheiro(valor),
                    'Valor'
                  ]}
                />

                <Bar
                  dataKey="valor"
                  radius={[10, 10, 0, 0]}
                >
                  {dadosGraficoResumo.map(
                    (item) => (
                      <Cell
                        key={item.nome}
                        fill={item.fill}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="secao grafico-card">
          <div className="secao-topo">
            <div>
              <h2>Despesas por categoria</h2>
              <p>Distribuição das despesas</p>
            </div>
          </div>

          <div className="grafico-container">
            {dadosGraficoCategorias.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart>
                  <Pie
                    data={dadosGraficoCategorias}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="48%"
                    outerRadius={92}
                    innerRadius={55}
                    paddingAngle={2}
                    label={labelPizza}
                    labelLine={false}
                  >
                    {dadosGraficoCategorias.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            coresGrafico[
                              index %
                              coresGrafico.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(valor, nome) => [
                      formatarDinheiro(valor),
                      nome
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={38}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="sem-resultados">
                Nenhuma despesa no período.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relatorios-grid">
        <div className="secao">
          <div className="secao-topo">
            <div>
              <h2>Entradas por pagamento</h2>
              <p>Distribuição das entradas</p>
            </div>
          </div>

          <div className="resumo-lista">
            {Object.entries(
              entradasPorPagamento
            ).map(([forma, valor]) => (
              <div
                className="resumo-item"
                key={forma}
              >
                <span className="resumo-nome">
                  {forma}:
                </span>

                <strong className="valor-entrada">
                  {formatarDinheiro(valor)}
                </strong>
              </div>
            ))}

            {Object.keys(
              entradasPorPagamento
            ).length === 0 && (
              <div className="sem-resultados">
                Nenhuma entrada no período.
              </div>
            )}
          </div>
        </div>

        <div className="secao">
          <div className="secao-topo">
            <div>
              <h2>Despesas por pagamento</h2>
              <p>Distribuição das despesas</p>
            </div>
          </div>

          <div className="resumo-lista">
            {Object.entries(
              despesasPorPagamento
            ).map(([forma, valor]) => (
              <div
                className="resumo-item"
                key={forma}
              >
                <span className="resumo-nome">
                  {forma}:
                </span>

                <strong className="valor-despesa">
                  {formatarDinheiro(valor)}
                </strong>
              </div>
            ))}

            {Object.keys(
              despesasPorPagamento
            ).length === 0 && (
              <div className="sem-resultados">
                Nenhuma despesa no período.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>Despesas por categoria</h2>
            <p>Veja onde o dinheiro foi utilizado</p>
          </div>
        </div>

        <div className="resumo-lista">
          {Object.entries(
            despesasPorCategoria
          ).map(([categoria, valor]) => (
            <div
              className="resumo-item"
              key={categoria}
            >
              <span className="resumo-nome">
                {categoria}:
              </span>

              <strong className="valor-despesa">
                {formatarDinheiro(valor)}
              </strong>
            </div>
          ))}

          {Object.keys(
            despesasPorCategoria
          ).length === 0 && (
            <div className="sem-resultados">
              Nenhuma despesa no período.
            </div>
          )}
        </div>
      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>Movimentações do período</h2>

            <p>
              {movimentacoes.length} movimentação(ões)
              encontrada(s)
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            {movimentacoes.map(
              (movimentacao) => (
                <tr key={movimentacao.id}>
                  <td>
                    <span
                      className={
                        movimentacao.tipo ===
                        'Entrada'
                          ? 'tipo entrada'
                          : 'tipo despesa'
                      }
                    >
                      {movimentacao.tipo}
                    </span>
                  </td>

                  <td>
                    {movimentacao.descricao || '-'}
                  </td>

                  <td>
                    {formatarData(
                      movimentacao.data
                    )}
                  </td>

                  <td
                    className={
                      movimentacao.tipo ===
                      'Entrada'
                        ? 'valor-entrada'
                        : 'valor-despesa'
                    }
                  >
                    {movimentacao.tipo ===
                    'Entrada'
                      ? '+ '
                      : '- '}

                    {formatarDinheiro(
                      movimentacao.valor
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {movimentacoes.length === 0 && (
          <div className="sem-resultados">
            Nenhuma movimentação encontrada no período.
          </div>
        )}
      </div>
    </div>
  )
}

export default Relatorios