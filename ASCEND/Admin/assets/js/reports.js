 const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');

        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

// Fetch transaction reports and populate table
document.addEventListener('DOMContentLoaded', function() {
    // Load toolbar user - always show logged-in admin user
    (async function loadToolbarUser(){
        try{
            const resp = await fetch('phpbackend/get_current_user.php');
            const data = await resp.json();
            if (data && data.success){
                const nameEl = document.getElementById('userName');
                const avatarEl = document.getElementById('userAvatar');
                // Use AccountName if available, otherwise fallback to username
                const displayName = data.name || data.username || 'User';
                if (nameEl) nameEl.textContent = displayName;
                if (data.initials && avatarEl) avatarEl.textContent = data.initials;
            }
        }catch(e){console.error('Toolbar user load error:', e);}
    })();
    
    // Year filter elements
    const yearFilter = document.getElementById('yearFilter');
    const applyYearFilterBtn = document.getElementById('applyYearFilter');
    const resetYearFilterBtn = document.getElementById('resetYearFilter');
    
    // Populate year dropdown with available years (current year and past 5 years)
    function populateYearFilter() {
        if (!yearFilter) return;
        
        const currentYear = new Date().getFullYear();
        yearFilter.innerHTML = '<option value="">All Years</option>';
        
        // Add current year and past 5 years
        for (let i = 0; i <= 5; i++) {
            const year = currentYear - i;
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (i === 0) {
                option.selected = true; // Default to current year
            }
            yearFilter.appendChild(option);
        }
    }
    
    // Initialize year filter
    populateYearFilter();
    
    // Load monthly transaction data for line graph
    async function loadMonthlyTransactions(year = null) {
        try {
            let url = 'phpbackend/get_monthly_transactions.php';
            const params = new URLSearchParams();
            if (year) {
                params.append('year', year);
            }
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.monthlyData) {
                console.log('Monthly transaction data loaded:', data);
                updateLineGraph(data.monthlyData, data.maxCount);
            } else {
                console.error('Failed to load monthly transactions:', data.error || 'Unknown error');
                // Show empty state
                updateLineGraph({}, 100);
            }
        } catch (error) {
            console.error('Error loading monthly transactions:', error);
            // Show empty state on error
            updateLineGraph({}, 100);
        }
    }
    
    // Apply year filter
    if (applyYearFilterBtn) {
        applyYearFilterBtn.addEventListener('click', function() {
            const selectedYear = yearFilter ? yearFilter.value : null;
            loadMonthlyTransactions(selectedYear);
            loadTransactionReports(selectedYear);
        });
    }
    
    // Reset year filter
    if (resetYearFilterBtn) {
        resetYearFilterBtn.addEventListener('click', function() {
            if (yearFilter) {
                yearFilter.value = new Date().getFullYear().toString();
            }
            loadMonthlyTransactions(null);
            loadTransactionReports(null);
        });
    }
    
    // Update line graph with monthly data
    function updateLineGraph(monthlyData, maxCount) {
        const chartContainer = document.querySelector('.line-chart-container');
        if (!chartContainer) {
            console.error('Line chart container not found');
            return;
        }
        
        const svg = chartContainer.querySelector('.line-chart-svg');
        if (!svg) {
            console.error('SVG element not found');
            return;
        }
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Ensure maxCount is at least 1 to avoid division by zero
        if (maxCount === 0) {
            maxCount = 1;
        }
        
        // Chart dimensions
        const padding = { top: 10, right: 30, bottom: 50, left: 50 };
        const width = 1200;
        const height = 440;
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Calculate max label for scaling
        let maxLabel = Math.ceil(maxCount / 10) * 10;
        if (maxLabel === 0) maxLabel = 10; // Ensure at least 10 for display
        const steps = 5;
        const stepValue = maxLabel / steps;
        
        // Prepare data points
        const dataPoints = [];
        months.forEach((month, index) => {
            const monthData = monthlyData[month] || { count: 0 };
            const x = padding.left + (index / (months.length - 1)) * chartWidth;
            // Calculate y position - 0 at bottom, max at top
            const percentage = maxLabel > 0 ? (monthData.count / maxLabel) : 0;
            // SVG coordinates: y increases downward, so we invert
            // Bottom of chart: height - padding.bottom
            // Top of chart: padding.top
            // For value 0, y should be at bottom
            // For max value, y should be at top
            const y = (height - padding.bottom) - (percentage * chartHeight);
            dataPoints.push({ x, y, count: monthData.count, month, amount: monthData.amount || 0 });
        });
        
        console.log('Data points prepared:', dataPoints);
        
        // Draw grid lines (horizontal lines from bottom to top)
        const gridLines = svg.querySelector('.grid-lines');
        if (gridLines) {
            gridLines.innerHTML = '';
            for (let i = 0; i <= steps; i++) {
                // Calculate y position - 0 at bottom, max at top (same calculation as labels)
                const y = (height - padding.bottom) - (i / steps) * chartHeight;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', padding.left);
                line.setAttribute('y1', y);
                line.setAttribute('x2', width - padding.right);
                line.setAttribute('y2', y);
                line.setAttribute('stroke', '#e5e5e5');
                line.setAttribute('stroke-width', '1');
                line.setAttribute('stroke-dasharray', '2,2');
                gridLines.appendChild(line);
            }
        }
        
        // Update Y-axis labels AFTER grid lines are drawn to ensure SVG is rendered
        // Use setTimeout to ensure SVG is fully rendered and positioned
        setTimeout(() => {
            const yAxis = chartContainer.querySelector('.y-axis');
            const chartArea = chartContainer.querySelector('.chart-area');
            const svgElement = svg;
            if (yAxis && chartArea && svgElement) {
                yAxis.innerHTML = '';
                
                // Get bounding boxes for coordinate conversion
                const svgRect = svgElement.getBoundingClientRect();
                const chartAreaRect = chartArea.getBoundingClientRect();
                const containerRect = chartContainer.getBoundingClientRect();
                
                // SVG viewBox dimensions
                const svgViewBoxHeight = height; // 440
                const svgActualHeight = svgRect.height;
                const scaleY = svgActualHeight / svgViewBoxHeight;
                
                // Container padding values (from CSS)
                const containerPaddingTop = 10;
                const containerPaddingBottom = 50;
                
                // Calculate where the chart area starts relative to container
                const chartAreaTopOffset = chartAreaRect.top - containerRect.top;
                
                // Position labels to match grid line positions exactly
                for (let i = steps; i >= 0; i--) {
                    const span = document.createElement('span');
                    span.textContent = Math.round(i * stepValue);
                    
                    // Calculate Y position in SVG viewBox coordinates (same as grid lines)
                    // This gives us: i=0 (bottom) -> height-padding.bottom, i=steps (top) -> padding.top
                    const svgY = (height - padding.bottom) - (i / steps) * chartHeight;
                    
                    // Convert to percentage of SVG height (0 = top of viewBox, 1 = bottom)
                    const svgYPercent = svgY / height;
                    
                    // Convert to actual pixel position in rendered SVG
                    const pixelYInSvg = svgYPercent * svgActualHeight;
                    
                    // Get SVG's position within chart area
                    const svgTopInChartArea = svgRect.top - chartAreaRect.top;
                    
                    // Final position: container top + chart area offset + SVG offset + pixel Y
                    const relativeY = chartAreaTopOffset + svgTopInChartArea + pixelYInSvg;
                    
                    // Position absolutely to align with grid lines
                    span.style.position = 'absolute';
                    span.style.top = `${relativeY}px`;
                    span.style.transform = 'translateY(-50%)';
                    yAxis.appendChild(span);
                }
            }
        }, 0);
        
        // Remove existing axis lines if any
        const existingAxes = svg.querySelectorAll('.axis-line');
        existingAxes.forEach(axis => axis.remove());
        
        // Draw vertical axis line (left side)
        const verticalAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        verticalAxis.setAttribute('class', 'axis-line');
        verticalAxis.setAttribute('x1', padding.left);
        verticalAxis.setAttribute('y1', padding.top);
        verticalAxis.setAttribute('x2', padding.left);
        verticalAxis.setAttribute('y2', height - padding.bottom);
        verticalAxis.setAttribute('stroke', '#999');
        verticalAxis.setAttribute('stroke-width', '2');
        if (gridLines && gridLines.parentNode) {
            gridLines.parentNode.insertBefore(verticalAxis, gridLines);
        }
        
        // Draw horizontal axis line (bottom)
        const horizontalAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        horizontalAxis.setAttribute('class', 'axis-line');
        horizontalAxis.setAttribute('x1', padding.left);
        horizontalAxis.setAttribute('y1', height - padding.bottom);
        horizontalAxis.setAttribute('x2', width - padding.right);
        horizontalAxis.setAttribute('y2', height - padding.bottom);
        horizontalAxis.setAttribute('stroke', '#999');
        horizontalAxis.setAttribute('stroke-width', '2');
        if (gridLines && gridLines.parentNode) {
            gridLines.parentNode.insertBefore(horizontalAxis, gridLines);
        }
        
        // Draw the line path
        const linePath = svg.querySelector('.line-path');
        if (linePath && dataPoints.length > 0) {
            // Build path with smooth curve using quadratic bezier curves
            let pathData = `M ${dataPoints[0].x} ${dataPoints[0].y}`;
            
            // Use simple line segments for now (can be upgraded to curves later)
            for (let i = 1; i < dataPoints.length; i++) {
                pathData += ` L ${dataPoints[i].x} ${dataPoints[i].y}`;
            }
            
            linePath.setAttribute('d', pathData);
            linePath.setAttribute('stroke', 'rgb(245, 112, 64)');
            linePath.setAttribute('stroke-width', '3');
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.setAttribute('stroke-linejoin', 'round');
            linePath.style.opacity = '1';
            linePath.style.visibility = 'visible';
            console.log('Line path drawn:', pathData);
            console.log('Data points:', dataPoints.map(p => `${p.month}: ${p.count} (${p.x}, ${p.y})`));
        } else {
            console.warn('Line path or data points not found', {
                linePath: !!linePath,
                dataPointsLength: dataPoints.length
            });
        }
        
        // Draw data points
        const dataPointsGroup = svg.querySelector('.data-points');
        if (dataPointsGroup) {
            dataPointsGroup.innerHTML = '';
            dataPoints.forEach((point, index) => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', point.x);
                circle.setAttribute('cy', point.y);
                circle.setAttribute('r', point.count > 0 ? 4 : 0);
                circle.setAttribute('data-month', point.month);
                circle.setAttribute('data-count', point.count);
                circle.setAttribute('data-amount', point.amount);
                
                // Add tooltip on hover
                circle.addEventListener('mouseenter', function(e) {
                    // Remove any existing tooltips
                    const existingTooltips = document.querySelectorAll('.chart-tooltip');
                    existingTooltips.forEach(t => t.remove());
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'chart-tooltip';
                    const amount = point.amount ? parseFloat(point.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : '0.00';
                    tooltip.innerHTML = `<strong>${point.month}</strong><br>Transactions: ${point.count}<br>Amount: ₱${amount}`;
                    tooltip.style.position = 'absolute';
                    const rect = svg.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + point.x + 10}px`;
                    tooltip.style.top = `${rect.top + point.y - 50}px`;
                    tooltip.style.background = 'rgba(0,0,0,0.9)';
                    tooltip.style.color = '#fff';
                    tooltip.style.padding = '8px 12px';
                    tooltip.style.borderRadius = '6px';
                    tooltip.style.fontSize = '12px';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    tooltip.style.lineHeight = '1.5';
                    document.body.appendChild(tooltip);
                    circle._tooltip = tooltip;
                });
                
                circle.addEventListener('mouseleave', function() {
                    if (circle._tooltip) {
                        document.body.removeChild(circle._tooltip);
                        circle._tooltip = null;
                    }
                });
                
                dataPointsGroup.appendChild(circle);
            });
        }
        
        // Draw month labels
        const monthLabels = svg.querySelector('.month-labels');
        if (monthLabels) {
            monthLabels.innerHTML = '';
            months.forEach((month, index) => {
                // Calculate x position - ensure last month (Dec) is fully visible
                const x = padding.left + (index / (months.length - 1)) * chartWidth;
                // Position labels below the chart with enough space
                const y = height - padding.bottom + 25;
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.textContent = month;
                text.setAttribute('font-size', '12');
                text.setAttribute('fill', '#666');
                text.setAttribute('text-anchor', 'middle');
                monthLabels.appendChild(text);
            });
        }
        
        console.log('Line graph updated with maxCount:', maxCount);
    }
    
    // Load monthly transactions on page load (default to current year)
    const currentYear = new Date().getFullYear();
    loadMonthlyTransactions(currentYear);
    
    // Load transaction reports with optional year filtering
    function loadTransactionReports(year = null) {
        let url = 'phpbackend/get_transaction_reports.php';
        const params = new URLSearchParams();
        if (year) {
            // Set date range for the selected year
            params.append('start', `${year}-01-01`);
            params.append('end', `${year}-12-31`);
        }
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const tbody = document.getElementById('reportsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(tx => {
                    const tr = document.createElement('tr');
                    // Determine color based on activity type
                    const activity = (tx.TransactionActivity || '').toLowerCase();
                    const isDebit = activity.includes('withdraw') || activity.includes('debit') || activity.includes('send') || activity.includes('pay');
                    const amountColor = isDebit ? '#ef4444' : '#10b981';
                    
                    // Format date
                    const dateStr = tx.TransactionDate ? new Date(tx.TransactionDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    }) : '';
                    
                    // Format amount
                    const amount = tx.TransactionAmount ? parseFloat(tx.TransactionAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }) : '0.00';
                    
                    tr.innerHTML = `
                        <td>${dateStr}</td>
                        <td>${tx.AccountNumber || tx.AccountID || 'N/A'}</td>
                        <td>${tx.TransactionActivity || 'N/A'}</td>
                        <td style="color:${amountColor};font-weight:600;">₱${amount}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="4" style="text-align:center;padding:20px;color:#666;">No transactions found.</td>';
                tbody.appendChild(tr);
            }
        })
        .catch(err => {
            console.error('Failed to fetch transaction reports:', err);
            const tbody = document.getElementById('reportsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error loading transactions.</td></tr>';
            }
        });
    }
    
    // Modal functionality
    const viewReportsBtn = document.getElementById('viewReportsBtn');
    const reportsModalOverlay = document.getElementById('reportsModalOverlay');
    const reportsModalClose = document.getElementById('reportsModalClose');
    
    // Open modal
    if (viewReportsBtn && reportsModalOverlay) {
        viewReportsBtn.addEventListener('click', () => {
            // Load reports data when opening modal
            const selectedYear = yearFilter ? yearFilter.value : currentYear;
            loadTransactionReports(selectedYear || currentYear);
            reportsModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Close modal
    if (reportsModalClose && reportsModalOverlay) {
        reportsModalClose.addEventListener('click', () => {
            reportsModalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close modal when clicking overlay
    if (reportsModalOverlay) {
        reportsModalOverlay.addEventListener('click', (e) => {
            if (e.target === reportsModalOverlay) {
                reportsModalOverlay.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
    }
    
    // PDF Export functionality
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            generatePDF();
        });
    }
    
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get table data
        const table = document.querySelector('.reports-table');
        if (!table) {
            alert('No data to export');
            return;
        }
        
        // Get table headers
        const headers = [];
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            headers.push(cell.textContent.trim());
        });
        
        // Get table rows data
        const rows = [];
        const tableRows = table.querySelectorAll('tbody tr');
        
        if (tableRows.length === 0) {
            alert('No transactions to export');
            return;
        }
        
        tableRows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                // Get text content
                let text = cell.textContent.trim();
                
                // For amount column (index 3), extract numeric value and format with PHP
                if (index === 3) {
                    // Remove peso sign and any other non-numeric characters except decimal point
                    const numericValue = text.replace(/[₱±+-\s,]/g, '').trim();
                    // Format with PHP prefix, ensuring consistent spacing for alignment
                    if (numericValue) {
                        const formattedNum = parseFloat(numericValue).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        // Use consistent format: PHP prefix with proper spacing
                        text = 'PHP ' + formattedNum;
                    } else {
                        text = 'PHP 0.00';
                    }
                }
                
                rowData.push(text);
            });
            rows.push(rowData);
        });
        
        // Add title
        doc.setFontSize(18);
        doc.text('Transaction Reports', 14, 15);
        
        // Add date
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${currentDate}`, 14, 22);
        doc.setTextColor(0, 0, 0);
        
        // Add table using autoTable
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 28,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                halign: 'left' // Default left align for all columns
            },
            headStyles: {
                fillColor: [255, 138, 61], // Orange color matching theme
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            didParseCell: function (data) {
                // Right align the "Amount" header to match the values
                if (data.section === 'head' && data.column.index === 3) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { right: 10, left: 3, top: 3, bottom: 3 };
                }
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            columnStyles: {
                0: { halign: 'left' },  // Date
                1: { halign: 'left' },  // Account No.
                2: { halign: 'left' },  // Activity
                3: { 
                    halign: 'right',    // Right align amount column
                    cellPadding: { right: 10, left: 3, top: 3, bottom: 3 }
                }
            },
            margin: { top: 28 }
        });
        
        // Open PDF in new window instead of auto-saving
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
        }, 100);
    }
    
    // Load transaction reports on page load (default to current year) - but don't show modal
    // Data will be loaded when modal is opened
});