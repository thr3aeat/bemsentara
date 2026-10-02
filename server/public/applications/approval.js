(function () {
  'use strict';

  var canvas = document.getElementById('signature-canvas');
  var clearBtn = document.getElementById('btn-clear-sig');
  var submitBtn = document.getElementById('btn-submit-approval');
  var hintText = document.getElementById('canvas-hint');
  var form = document.getElementById('approval-form');

  var chkTruthful = document.getElementById('chk-truthful');
  var chkGuidelines = document.getElementById('chk-guidelines');
  var chkCommitments = document.getElementById('chk-commitments');

  var strokes = [];
  var currentStroke = null;
  var isDrawing = false;

  function initCanvas() {
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getCoords(e) {
      var r = canvas.getBoundingClientRect();
      return {
        x: Math.round((e.clientX - r.left) * 10) / 10,
        y: Math.round((e.clientY - r.top) * 10) / 10
      };
    }

    function onPointerDown(e) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      var pt = getCoords(e);
      currentStroke = [pt];
      strokes.push(currentStroke);

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);

      if (hintText) hintText.style.display = 'none';
      checkValidation();
    }

    function onPointerMove(e) {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      var pt = getCoords(e);
      currentStroke.push(pt);

      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }

    function onPointerUp(e) {
      if (!isDrawing) return;
      isDrawing = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
      checkValidation();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', function () {
      // Re-render strokes if resized
      var r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      redrawAll(ctx);
    });
  }

  function redrawAll(ctx) {
    if (!ctx || !canvas) return;
    for (var i = 0; i < strokes.length; i++) {
      var s = strokes[i];
      if (s.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (var j = 1; j < s.length; j++) {
        ctx.lineTo(s[j].x, s[j].y);
      }
      ctx.stroke();
    }
  }

  function clearCanvas() {
    strokes = [];
    currentStroke = null;
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    if (hintText) hintText.style.display = 'block';
    checkValidation();
  }

  function checkValidation() {
    if (!submitBtn) return;
    var allAgreed = Boolean(
      chkTruthful && chkTruthful.checked &&
      chkGuidelines && chkGuidelines.checked &&
      chkCommitments && chkCommitments.checked
    );
    var hasStroke = strokes.length > 0 && strokes.some(function (s) { return s.length >= 2; });

    submitBtn.disabled = !(allAgreed && hasStroke);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearCanvas();
    });
  }

  if (chkTruthful) chkTruthful.addEventListener('change', checkValidation);
  if (chkGuidelines) chkGuidelines.addEventListener('change', checkValidation);
  if (chkCommitments) chkCommitments.addEventListener('change', checkValidation);

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!submitBtn || submitBtn.disabled) return;

      submitBtn.disabled = true;
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'İşleniyor ve İmzalanıyor...';

      var token = form.getAttribute('data-token');
      var payload = {
        agreements: {
          truthful: Boolean(chkTruthful && chkTruthful.checked),
          guidelines: Boolean(chkGuidelines && chkGuidelines.checked),
          commitments: Boolean(chkCommitments && chkCommitments.checked)
        },
        strokes: strokes
      };

      try {
        var res = await fetch('/api/applications/approve/' + encodeURIComponent(token) + '/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        var data = await res.json();
        if (!res.ok) {
          alert(data.error || 'İşlem tamamlanamadı.');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        // Redirect or refresh to show success
        window.location.reload();
      } catch (err) {
        alert('Bağlantı hatası: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  initCanvas();
  checkValidation();
})();
