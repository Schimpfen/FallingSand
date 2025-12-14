import json
import urllib.error
import urllib.parse
import urllib.request

from Qt import QtWidgets, QtCore


class SimulationClient:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url.rstrip("/")

    def _request(self, path, method="GET", data=None):
        url = urllib.parse.urljoin(self.base_url + "/", path.lstrip("/"))
        payload = None
        headers = {}
        if data is not None:
            payload = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(url, data=payload, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=2) as response:
                body = response.read().decode("utf-8")
                if not body:
                    return {}
                return json.loads(body)
        except urllib.error.URLError as exc:
            raise RuntimeError(f"API unreachable: {exc}") from exc

    def metrics(self):
        return self._request("/metrics")

    def step(self):
        return self._request("/step", method="POST")

    def emit(self):
        return self._request("/emit", method="POST")

    def set_mix(self, ratio):
        return self._request("/mix", method="POST", data={"value": ratio})


class ControlPanel(QtWidgets.QWidget):
    def __init__(self, client: SimulationClient):
        super().__init__()
        self.client = client
        self.setWindowTitle("Falling Sand Control Panel")
        self.slider = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        self.slider.setRange(0, 100)
        self.slider.setValue(100)
        self.slider.valueChanged.connect(self.on_ratio_change)

        self.step_button = QtWidgets.QPushButton("Step once")
        self.step_button.clicked.connect(self.do_step)

        self.report_label = QtWidgets.QLabel("Delta h: --")
        self.status_label = QtWidgets.QLabel("")

        layout = QtWidgets.QVBoxLayout()
        layout.addWidget(QtWidgets.QLabel("Fine/Coarse mix (0=coarse, 100=fine)"))
        layout.addWidget(self.slider)
        layout.addWidget(self.step_button)
        layout.addWidget(self.report_label)
        layout.addWidget(self.status_label)
        self.setLayout(layout)

        self.poll_timer = QtCore.QTimer(self)
        self.poll_timer.timeout.connect(self.refresh_metrics)
        self.poll_timer.start(2000)
        self.refresh_metrics()

    def display_status(self, text, error=False):
        self.status_label.setText(text)
        self.status_label.setStyleSheet("color: red;" if error else "color: black;")

    def on_ratio_change(self, value):
        ratio = value / 100.0
        try:
            resp = self.client.set_mix(ratio)
            self.display_status(f"Mix ratio set to {resp.get('mix_ratio'):.2f}")
        except RuntimeError as exc:
            self.display_status(str(exc), error=True)

    def do_step(self):
        try:
            self.client.step()
            self.refresh_metrics()
        except RuntimeError as exc:
            self.display_status(str(exc), error=True)

    def refresh_metrics(self):
        try:
            metrics = self.client.metrics()
            delta = metrics.get("delta_h", "--")
            self.report_label.setText(f"Delta h: {delta}")
            self.display_status("")
        except RuntimeError as exc:
            self.display_status(str(exc), error=True)


if __name__ == "__main__":
    app = QtWidgets.QApplication([])
    client = SimulationClient()
    panel = ControlPanel(client)
    panel.show()
    app.exec()
