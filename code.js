
function curveBezierDrawer(canvas) {
    const ctx = canvas.getContext("2d")
    const clearButton = document.getElementById("button__clearAll")
    const removePointButton = document.getElementById("button__removePoint")
    const range = document.getElementById("range__input")
    const rangeValue = document.getElementById("range__value")

    /* 
        Setando para que a largura do canvas seja igual a largura da janela
        Subtraímos por 200 apenas para ter um espaçamento entre as bordas da janela e o canvas
    */
    const width = window.innerWidth - 200
	const height = window.innerHeight - 200
	canvas.setAttribute("width", width)
    canvas.setAttribute("height", height)

	const radius0 = 20.0
    const radius1 = radius0 * 0.7
    const radius2 = radius0 * 0.2
    const step = 0.001

    let points = []
    let selectedPoint
    let isRemovePointOption = false
    
    clearButton.onclick = onClearAll
    removePointButton.onclick = removePoint
    canvas.onmousedown = onCanvasMouseDown
	canvas.onmousemove = onCanvasMouseMove
	canvas.onmouseup = onCanvasMouseUp

    rangeValue.innerHTML = range.value
    let tSlider = range.value
    range.oninput = function() {
        rangeValue.innerHTML = this.value
        tSlider = this.value
        draw(tSlider)
    }

    draw()

	function draw() {		
		ctx.fillStyle = '#FFFFFF'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

        points.forEach((point) => {
            drawPoint(ctx, point)
            drawLine(points, point)
        })

        // curva quadrática   
        drawCurve(ctx, points)

        // curva cúbica
        drawCurve(ctx, points, true)
    }

    // Desenha o ponto inserido pelo usuário
    function drawPoint(ctx, point) {
        ctx.fillStyle = "gray"
		ctx.beginPath()
        ctx.arc(point.x, point.y, radius1, 0, 6.28318539, false)
		ctx.arc(point.x, point.y, radius0, 0, 6.28318539, true)
        if (isRemovePointOption) {
            ctx.strokeStyle = "red"
            ctx.stroke()
        }
		ctx.arc(point.x, point.y, radius2, 0, 6.28318539, true)
		ctx.fill()
        ctx.closePath()
    }


    /*
        Calcula os pontos da curva de bezier e monta ela.
        
        A curva bezier é uma curva paramétrica.
        Isso quer dizer que ela varia em função de um parâmetro (que chamamos aqui de t).
        Mas por que isso?
        Uma curva bezier é composta por vários pontos interligados.
        Para formar esse "caminho" de pontos até formar a curva, precisamos do parâmetro t.
        Onde cada ponto é formado por um valor de t diferente. 
        E esse t vai de 0 a 1.

        t=0 define o ponto inicial da curva
        t=1 define o ponto final da curva
        Todos os outros valores de t definem pontos entre o ponto inicial e final da curva
        Isso é chamado de interpolação linear.
        Interpolação porque estamos tentando encontrar pontos entre dois pontos. 
        Linear porque é um ponto que está restritamente na a linha entre os dois pontos.

    */
    function drawCurve(ctx, points, isCubic) {
        if(isCubic && points.length < 4 || points.length < 3) {
            return null
        }

        const start = points[0]
        let p = {}

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineWidth = 3

        for (let t = 0; t <= tSlider; t += step){
            p = isCubic ? calculateCubicBezierPoint(t, points, start) : calculateQuadraticBezierPoint(t, points, start)
            ctx.lineTo(p.x, p.y)
        }

        ctx.strokeStyle = isCubic ? 'red' : 'blue'
        ctx.stroke()
        ctx.closePath()  
    }

    /* 
        Calcula um ponto da curva de bezier quadrática em relação ao parâmetro t
        
        Como funciona o cálculo do ponto da curva quadrática na teoria:
            1 - Calcula a interpolação linear entre um ponto P0 e um ponto P1: A = (1-t)*P0 + t*P1
            2 - Calcula a interpolação linear entre um ponto P1 e um ponto P2: A = (1-t)*P1 + t*P2
            3 - Calcula o ponto da curva quadrática: P = (1-t)*A + t*B
            4 - Podia ter expandido a fórmula para um polinômio de Bernstein
    */
    function calculateQuadraticBezierPoint(t, points, start) {
        const a = 1 - t

        const controler = points[1]
        const end = points[2]

        // Interpolação linear entre os pontos start e controler
        const Ax = a*start.x + t*controler.x
        const Ay = a*start.y + t*controler.y

        // Interpolação linear entre os pontos controler e end
        const Bx = a*controler.x + t*end.x
        const By = a*controler.y + t*end.y
        
        // Interpolação linear entre os pontos A e B
        const x = a * Ax + t * Bx
        const y = a * Ay + t * By

        return {x, y}
    }


    /* 
        Calcula um ponto da curva de bezier cúbica em relação ao parâmetro t 
        
        Como funciona o cálculo do ponto da curva cúbica na teoria:
            1. Calcula o ponto A (interpolação linear entre p0 e p1) A = (1-t)*P0 + t*P1
            2. Calcula o ponto B (interpolação linear entre p1 e p2) B = (1-t)*P1 + t*P2
            3. Calcula o ponto C (interpolação linear entre p2 e p3) C = (1-t)*P2 + t*P3
            4. Calcula o ponto D (interpolação linear entre A e B) D = (1-t)*A + t*B
            5. Calcula o ponto E (interpolação linear entre B e C) E = (1-t)*B + t*C
            6. Calcula o ponto F (interpolação linear entre D e E - Fórmula final do ponto da curva) F = (1-t)*D + t*E
            7. Expande a fórmula para um polinômio de Bernstein
        
        Fórmula expandida que foi usada nesta função:
            p0 * (1 - t)³ + p1 * 3 * (1 - t)² + 3 * p2 * t² * (1 - t) + p3 * t²
    */
    function calculateCubicBezierPoint(t, points, start) {
        const m = 1 - t
        const tSquared = t * t
        const mSquared = m * m
        const a = mSquared * m
        const b = mSquared * t * 3
        const c = tSquared * m * 3
        const d = tSquared * t

        const controler1 = points[1]
        const controler2 = points[2]
        const end = points[3]
        
        const x = start.x * a + controler1.x * b + controler2.x * c + end.x * d
        const y = start.y * a + controler1.y * b + controler2.y * c + end.y * d

        return {x, y}
    }

    /*
        Desenha as linhas retas entre os pontos
        Pega o ponto anterior do array e o ponto atual da iteração do array de pontos
        Traça uma linha entre eles usando os recursos do canvas
    */
    function drawLine (points, currentPoint) {
        if (points.length > 1) {

            const currentIndex = points.indexOf(currentPoint)
            const beforePoint = points.find((point, index) => index === currentIndex - 1)

            if (!beforePoint) {
                return null
            }

            ctx.beginPath()
            ctx.moveTo(currentPoint.x, currentPoint.y)
            ctx.lineWidth = 1
            ctx.strokeStyle = 'gray'
            ctx.lineTo(beforePoint.x, beforePoint.y)
            ctx.stroke()
            ctx.closePath()
        }
    }

    /*
        Função usada para retornar o ponto que foir selecionado para ser movido ou removido.
        Se o mouse for clicado ou estiver em cima de algum ponto, retorna o ponto.
    */
    function mouseOverPoint(mouse) {
		let p = undefined
        let i = undefined

        points.forEach(function(point) {
            const a = point.x + radius0
            const b = point.x - radius0
            const c = point.y + radius0
            const d = point.y - radius0

            if((a > mouse.x && b < mouse.x) && (c > mouse.y && d < mouse.y)) {
                p = point
            }
		})
	
		return p
    }

    //Função usada para retornar as coordenadas x e y do mouse.
	function getMousePoint(event) {
		let rect = canvas.getBoundingClientRect()
		return {x: event.clientX - rect.left, y: event.clientY - rect.top}
	}
	
    /* 
        Função atribuída ao evento "mousedown" do canvas.
        É chamada quando o botão do mouse é pressionado sobre o canvas.
    */
	function onCanvasMouseDown(e) {
		const mouse = getMousePoint(e)
		selectedPoint = mouseOverPoint(mouse)

        const isSelectedPointToRemove = selectedPoint !== undefined && isRemovePointOption

        if (isSelectedPointToRemove) {
            const i = points.indexOf(selectedPoint)
            points.splice(i, 1)
            isRemovePointOption = false
        }

        if (!selectedPoint && points.length < 4) {
            points.push(mouse)
        }

		draw()
	
    }

    /*
        Função atribuída ao evento "mousemove" do canvas
        É chamada quando o mouse é movido enquanto o ponto de acesso do cursor está dentro do canvas.
    */
	function onCanvasMouseMove(e) {
		const mouse = getMousePoint(e)
		const controlPoint = mouseOverPoint(mouse)
	
		canvas.style.cursor = controlPoint ? 'move' : 'default'

		if (selectedPoint !== undefined) {		
			selectedPoint.x = mouse.x
			selectedPoint.y = mouse.y
			draw()
			e.preventDefault()
		} 
	}

    /*
        Função atribuída ao evento "mouseup" do canvas
        É chamada quando o mouse é liberado enquanto o ponteiro está localizado dentro do canvas.
    */
	function onCanvasMouseUp(e) {	
		selectedPoint = undefined
		window.removeEventListener("mousemove", onCanvasMouseMove, false)
		window.removeEventListener("mouseup", onCanvasMouseUp, false)
	}

     /*
        Função para limpar todo o conteúdo do canvas.
        É chamada quando você clica no botão de "Limpar".
     */
    function onClearAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        points = []
    }

    /*
        Função usada para remover um ponto inserido pelo usuário.
        É chamada quando o usuário segue os passos a seguir:
        1. Clica no botão de "Remover ponto"
        2. Clica em um ponto inserido pelo usuário
    */
    function removePoint() {
        isRemovePointOption = true
        draw()
    }
}

// Garantir que tudo do DOM foi carregado antes de executar esse código
document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("canvas")
    curveBezierDrawer(canvas)
})