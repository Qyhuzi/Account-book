document.addEventListener('DOMContentLoaded', () => {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transactionForm = document.getElementById('transactionForm');
    const dailySummaryTable = document.getElementById('dailySummaryTable');
    const monthlySummaryTable = document.getElementById('monthlySummaryTable'); // 월별 요약 테이블 참조
    const dateInput = document.getElementById('date');
    const pages = document.querySelectorAll('.page');
    const menuLinks = document.querySelectorAll('#menu a');

    // 오늘 날짜 기본값 설정
    dateInput.value = new Date().toISOString().split('T')[0];

    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    function groupTransactionsByDate() {
        return transactions.reduce((result, t) => {
            if (!result[t.date]) result[t.date] = { income: 0, expense: 0, details: [] };
            result[t.date][t.category] += t.amount;
            result[t.date].details.push(t);
            return result;
        }, {});
    }

    function groupTransactionsByMonth() {
        return transactions.reduce((result, t) => {
            const month = t.date.slice(0, 7); // Extract year and month (YYYY-MM)
            if (!result[month]) result[month] = { income: 0, expense: 0 };
            result[month][t.category] += t.amount;
            return result;
        }, {});
    }

    function updateDailySummary() {
        const groupedTransactions = groupTransactionsByDate();
        dailySummaryTable.innerHTML = '';

        Object.keys(groupedTransactions)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach((date) => {
                const { income, expense, details } = groupedTransactions[date];
                const balance = income - expense;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td class="income-text">${income}</td>
                    <td class="expense-text">${expense}</td>
                    <td>${balance}</td>
                `;
                row.classList.add('summary-row');
                dailySummaryTable.appendChild(row);

                // 행 클릭 시 세부 내용 토글
                row.addEventListener('click', () => {
                    const existingDetails = document.querySelector(`.details-row[data-date="${date}"]`);
                    if (existingDetails) {
                        existingDetails.remove(); // 이미 열려 있으면 닫기
                        return;
                    }

                    // 세부 내용 행 생성
                    const detailsRow = document.createElement('tr');
                    detailsRow.classList.add('details-row');
                    detailsRow.setAttribute('data-date', date);
                    detailsRow.innerHTML = `
                        <td colspan="4">
                            <table style="width: 100%; background: #f1f1f1; margin-top: 10px;">
                                <thead>
                                    <tr>
                                        <th>설명</th>
                                        <th>금액</th>
                                        <th>카테고리</th>
                                        <th>삭제</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${details.map((detail, index) => `
                                        <tr data-index="${index}">
                                            <td>${detail.description}</td>
                                            <td class="${detail.category}-text">${detail.amount}</td>
                                            <td>${detail.category === 'income' ? '수입' : '지출'}</td>
                                            <td><button class="delete-transaction" data-date="${date}" data-index="${index}">삭제</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </td>
                    `;
                    row.after(detailsRow);

                    // 삭제 버튼 이벤트 추가
                    detailsRow.querySelectorAll('.delete-transaction').forEach(button => {
                        button.addEventListener('click', (e) => {
                            e.stopPropagation(); // 삭제 버튼 클릭 시 행 클릭 이벤트 중단
                            const transactionIndex = button.getAttribute('data-index');
                            const transactionDate = button.getAttribute('data-date');

                            // 해당 트랜잭션 삭제
                            transactions.splice(
                                transactions.findIndex(t => t.date === transactionDate && t === groupedTransactions[transactionDate].details[transactionIndex]),
                                1
                            );
                            saveTransactions();

                            // 업데이트
                            updateDailySummary();
                            updateMonthlySummary(); // 월별 요약도 업데이트
                        });
                    });
                });
            });
    }

    function updateMonthlySummary() {
        const groupedTransactions = groupTransactionsByMonth();
        monthlySummaryTable.innerHTML = '';

        Object.keys(groupedTransactions)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach((month) => {
                const { income, expense } = groupedTransactions[month];
                const balance = income - expense;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${month}</td>
                    <td class="income-text">${income}</td>
                    <td class="expense-text">${expense}</td>
                    <td>${balance}</td>
                `;
                monthlySummaryTable.appendChild(row);
            });
    }

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = dateInput.value || new Date().toISOString().split('T')[0]; // 기본값 설정
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;

        if (date && description && !isNaN(amount) && category) {
            transactions.push({ date, description, amount, category });
            saveTransactions();
            updateDailySummary();
            updateMonthlySummary(); // 월별 요약 업데이트
            transactionForm.reset();
            dateInput.value = new Date().toISOString().split('T')[0]; // 날짜 디폴트 값 재설정
        } else {
            alert('모든 필드를 올바르게 입력하세요.');
        }
    });

    if (transactions.length > 0) {
        updateDailySummary();
        updateMonthlySummary();
    }

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });
});
