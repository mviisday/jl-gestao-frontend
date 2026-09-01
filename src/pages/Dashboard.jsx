import { useEffect, useState } from 'react'
import api from '../services/api'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

function Dashboard() {
  const [dados, setDados] = useState({
    totalEntradas: 0,
    totalDespesas: 0,
    resultado: 0
  })

  const [movimentacoes, setMovimentacoes] = useState([])
  const [despesasPeriodo, setDespesasPeriodo] = useState([])
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => {
    carregarDashboard()
  }, [periodo])

  function formatarDataApi(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')

    return `${ano}-${mes}-${dia}`
  }

  function calcularPeriodo() {
    const hoje = new Date()

    let inicio
    const fim = new Date(hoje)

    if (periodo === 'hoje') {
      inicio = new Date(hoje)
    }

    if (periodo === 'semana') {
      inicio = new Date(hoje)

      const diaSemana = hoje.getDay()
      const diferenca =
        diaSemana === 0
          ? 6
          : diaSemana - 1

      inicio.setDate(
        hoje.getDate() - diferenca
      )
    }

    if (periodo === 'mes') {
      inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      )
    }

    if (periodo === 'ano') {
      inicio = new Date(
        hoje.getFullYear(),
        0,
        1
      )
    }

    return {
      inicio: formatarDataApi(inicio),
      fim: formatarDataApi(fim)
    }
  }

  async function carregarDashboard() {
    try {
      const datas = calcularPeriodo()

      const [
        resultadoResposta,
        entradasResposta,
        despesasResposta
      ] = await Promise.all([
        api.get('/resultado', {
          params: {
            inicio: datas.inicio,
            fim: datas.fim
          }
        }),
        api.get('/entradas'),
        api.get('/despesas')
      ])

      setDados(resultadoResposta.data)

      const entradas = entradasResposta.data.filter(
        (entrada) =>
          entrada.data >= datas.inicio &&
          entrada.data <= datas.fim
      )

      const despesas = despesasResposta.data.filter(
        (despesa) =>
          despesa.data >= datas.inicio &&
          despesa.data <= datas.fim
      )

      setDespesasPeriodo(despesas)

      const entradasMovimentacao =
        entradas.map((entrada) => ({
          id: `entrada-${entrada.id}`,
          tipo: 'Entrada',
          descricao: entrada.descricao,
          data: entrada.data,
          valor: entrada.valor
        }))

      const despesasMovimentacao =
        despesas.map((despesa) => ({
          id: `despesa-${despesa.id}`,
          tipo: 'Despesa',
          descricao: despesa.descricao,
          data: despesa.data,
          valor: despesa.valor
        }))

      const todasMovimentacoes = [
        ...entradasMovimentacao,
        ...despesasMovimentacao
      ]

      todasMovimentacoes.sort((a, b) =>
        b.data.localeCompare(a.data)
      )

      setMovimentacoes(
        todasMovimentacoes.slice(0, 5)
      )
    } catch (erro) {
      console.error(
        'Erro ao carregar dashboard:',
        erro
      )
    }
  }

  function formatarDinheiro(valor) {
    return Number(valor || 0).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    )
  }

  function formatarData(data) {
    if (!data) {
      return ''
    }

    const [ano, mes, dia] = data.split('-')

    return `${dia}/${mes}/${ano}`
  }

  function textoPeriodo() {
    if (periodo === 'hoje') {
      return 'Hoje'
    }

    if (periodo === 'semana') {
      return 'Esta semana'
    }

    if (periodo === 'mes') {
      return 'Este mês'
    }

    if (periodo === 'ano') {
      return 'Este ano'
    }

    return ''
  }

  function abrirPagina(caminho) {
    window.location.href = caminho
  }

  const despesasPendentes =
    despesasPeriodo.filter(
      (despesa) =>
        despesa.status === 'PENDENTE'
    )

  const totalPendente =
    despesasPendentes.reduce(
      (total, despesa) =>
        total + Number(despesa.valor),
      0
    )

  const categorias = despesasPeriodo.reduce(
    (resultado, despesa) => {
      const nome =
        despesa.categoria?.nome ||
        'Sem categoria'

      if (!resultado[nome]) {
        resultado[nome] = 0
      }

      resultado[nome] +=
        Number(despesa.valor)

      return resultado
    },
    {}
  )

  const principaisCategorias =
    Object.entries(categorias)
      .map(([nome, valor]) => ({
        nome,
        valor
      }))
      .sort(
        (a, b) =>
          b.valor - a.valor
      )
      .slice(0, 5)

  const dadosGrafico = [
    {
      nome: 'Entradas',
      valor: Number(dados.totalEntradas),
      cor: '#22c55e'
    },
    {
      nome: 'Despesas',
      valor: Number(dados.totalDespesas),
      cor: '#ef4444'
    }
  ]

  return (
    <>
      <div className="topo">
        <div>
          <h1>Dashboard</h1>
          <p>
            Visão geral financeira da empresa
          </p>
        </div>

        <div className="periodo">
          <span>Período</span>

          <select
            value={periodo}
            onChange={(evento) =>
              setPeriodo(evento.target.value)
            }
          >
            <option value="hoje">
              Hoje
            </option>

            <option value="semana">
              Esta semana
            </option>

            <option value="mes">
              Este mês
            </option>

            <option value="ano">
              Este ano
            </option>
          </select>
        </div>
      </div>

      <div className="cards dashboard-cards">

        <div
          className="card card-entrada card-clicavel"
          onClick={() =>
            abrirPagina('/entradas')
          }
        >
          <span className="card-titulo">
            Entradas
          </span>

          <strong>
            {formatarDinheiro(
              dados.totalEntradas
            )}
          </strong>

          <small>
            {textoPeriodo()}
          </small>

          <span className="card-abrir">
            Ver entradas →
          </span>
        </div>

        <div
          className="card card-despesa card-clicavel"
          onClick={() =>
            abrirPagina('/despesas')
          }
        >
          <span className="card-titulo">
            Despesas
          </span>

          <strong>
            {formatarDinheiro(
              dados.totalDespesas
            )}
          </strong>

          <small>
            {textoPeriodo()}
          </small>

          <span className="card-abrir">
            Ver despesas →
          </span>
        </div>

        <div
          className="card card-resultado card-clicavel"
          onClick={() =>
            abrirPagina('/relatorios')
          }
        >
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

          <span className="card-abrir">
            Ver relatório →
          </span>
        </div>

        <div
          className="card card-pendente card-clicavel"
          onClick={() =>
            abrirPagina(
              '/despesas?status=PENDENTE'
            )
          }
        >
          <span className="card-titulo">
            Despesas pendentes
          </span>

          <strong>
            {formatarDinheiro(
              totalPendente
            )}
          </strong>

          <small>
            {despesasPendentes.length}{' '}
            pendência(s)
          </small>

          <span className="card-abrir">
            Ver pendências →
          </span>
        </div>

      </div>

      <div className="dashboard-grid">

        <div className="secao">
          <div className="secao-topo">
            <div>
              <h2>
                Entradas x Despesas
              </h2>

              <p>
                Comparação de{' '}
                {textoPeriodo().toLowerCase()}
              </p>
            </div>
          </div>

          <div className="grafico-container">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={dadosGrafico}
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
                  formatter={(valor) => [
                    formatarDinheiro(valor),
                    'Valor'
                  ]}
                />

                <Bar
                  dataKey="valor"
                  radius={[10, 10, 0, 0]}
                >
                  {dadosGrafico.map(
                    (item) => (
                      <Cell
                        key={item.nome}
                        fill={item.cor}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="secao">
          <div className="secao-topo">
            <div>
              <h2>
                Principais despesas
              </h2>

              <p>
                Categorias com maior gasto
              </p>
            </div>
          </div>

          <div className="resumo-lista">
            {principaisCategorias.map(
              (categoria, index) => (
                <div
                  className="resumo-item"
                  key={categoria.nome}
                >
                  <div className="categoria-ranking">
                    <span className="ranking-numero">
                      {index + 1}
                    </span>

                    <span className="resumo-nome">
                      {categoria.nome}:
                    </span>
                  </div>

                  <strong className="valor-despesa">
                    {formatarDinheiro(
                      categoria.valor
                    )}
                  </strong>
                </div>
              )
            )}

            {principaisCategorias.length ===
              0 && (
              <div className="sem-resultados">
                Nenhuma despesa neste período.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="secao">
        <div className="secao-topo">
          <div>
            <h2>
              Últimas movimentações
            </h2>

            <p>
              Movimentações de{' '}
              {textoPeriodo().toLowerCase()}
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
                <tr
                  key={movimentacao.id}
                >
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
                    {movimentacao.descricao ||
                      '-'}
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
            Nenhuma movimentação encontrada neste período.
          </div>
        )}
      </div>
    </>
  )
}

export default Dashboard