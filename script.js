
    let allOS = [];

    async function loadExternalReport() {
        try {
            // Carrega a página externa
            const response = await fetch('relatoriobruto.html'); // Substitua pelo caminho correto
            const rawReport = await response.text();

            // Parse do HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawReport, "text/html");
            const tables = doc.querySelectorAll('table[cellspacing="0"]');
            const osList = [];

            tables.forEach(table => {
                const os = {};
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const label = cells[1].textContent.trim();
                        const value = cells[2].textContent.trim();

                        if (label.startsWith('Nº OS:')) os.id = value;
                        if (label.startsWith('Situação:')) os.situacao = value;
                        if (label.startsWith('Prioridade:')) os.prioridade = value;
                        if (label.startsWith('Setor:')) os.setor = value;
                        if (label.startsWith('Equipamento:')) os.equipamento = value;
                        if (label.startsWith('Aberta em:')) {
                            const dateMatch = value.match(/(\d{2}\/\d{2}\/\d{4})/);
                            os.dataAbertura = dateMatch ? dateMatch[1] : '';
                        }
                    }
                });
                if (os.id && os.situacao) {
                    osList.push(os);
                }
            });

            return osList;
        } catch (err) {
            console.error('Erro ao carregar relatório externo:', err);
            return [];
        }
    }

    function renderDashboard(osList) {
        const abertasCount = osList.filter(os => os.situacao === 'Aberta').length;
        const pendentesCount = osList.filter(os => os.situacao === 'Pendente').length;
        const fechadasCount = osList.filter(os => os.situacao === 'Fechada').length;

        document.getElementById('abertas-count').textContent = abertasCount;
        document.getElementById('pendentes-count').textContent = pendentesCount;
        document.getElementById('fechadas-count').textContent = fechadasCount;

        const tableBody = document.getElementById('os-table-body');
        tableBody.innerHTML = '';

        osList.forEach(os => {
            let statusColor = os.situacao === 'Aberta' ? 'bg-red-500' :
                              os.situacao === 'Pendente' ? 'bg-yellow-500' : 'bg-green-500';

            let priorityColor = os.prioridade === 'ALTA' ? 'bg-red-500' :
                                os.prioridade === 'MÉDIA' ? 'bg-yellow-500' :
                                os.prioridade === 'BAIXA' ? 'bg-green-500' : 'bg-gray-500';

            const row = `
                <tr>
                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${os.dataAbertura || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${os.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="status-pill ${statusColor}">${os.situacao}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="status-pill ${priorityColor}">${os.prioridade}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${os.setor || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${os.equipamento || 'N/A'}</td>
                   
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    function applyFilters() {
        const dataInicial = document.getElementById('data-inicial').value;
        const dataFinal = document.getElementById('data-final').value;
        const situacaoFiltro = document.getElementById('situacao-filtro').value;

        const filteredOS = allOS.filter(os => {
            const osDateParts = os.dataAbertura.split('/');
            const osDate = new Date(`${osDateParts[2]}-${osDateParts[1]}-${osDateParts[0]}`);

            const isWithinDateRange = (!dataInicial || osDate >= new Date(dataInicial)) &&
                                      (!dataFinal || osDate <= new Date(dataFinal));

            const isStatusMatch = (situacaoFiltro === 'Todos' || os.situacao === situacaoFiltro);

            return isWithinDateRange && isStatusMatch;
        });

        renderDashboard(filteredOS);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        allOS = await loadExternalReport();
        renderDashboard(allOS);
    });
