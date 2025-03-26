import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// 定义与后端匹配的枚举类型
const Architecture = {
  X86: "X86",
  X86_64: "X86_64",
  ARM: "ARM",
  ARM64: "ARM64",
  MIPS: "MIPS",
  PPC: "PPC",
  SPARC: "SPARC"
};

const EndianType = {
  Little: "Little",
  Big: "Big"
};

// 不同架构对应的模式映射
const archModes = {
  [Architecture.X86]: 32,     // 32位模式
  [Architecture.X86_64]: 64,  // 64位模式
  [Architecture.ARM]: 32,     // ARM默认32位
  [Architecture.ARM64]: 64,   // ARM64默认64位
  [Architecture.MIPS]: 32,    // MIPS默认32位
  [Architecture.PPC]: 32,     // PPC默认32位
  [Architecture.SPARC]: 32    // SPARC默认32位
};

function App() {
  // 定义状态
  const [arch, setArch] = createSignal(Architecture.X86_64);
  const [operation, setOperation] = createSignal("disasm");
  const [inputCode, setInputCode] = createSignal("");
  const [outputResult, setOutputResult] = createSignal("");
  const [baseAddress, setBaseAddress] = createSignal("0x0");
  const [endianType, setEndianType] = createSignal(EndianType.Little);

  // 处理汇编操作
  async function handleAssemble() {
    try {
      const mode = archModes[arch()];
      const result = await invoke("assemble", {
        asmStr: inputCode(),
        arch: arch(),
        mode: mode,
        endian: endianType()
      });
      // 将结果字节数组转换为十六进制字符串显示
      const hexResult = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join(' ');
      setOutputResult(hexResult);
    } catch (error) {
      setOutputResult(`错误: ${error}`);
    }
  }

  // 处理反汇编操作
  async function handleDisassemble() {
    try {
      // 将十六进制字符串转换为字节数组
      const hexValues = inputCode().trim().split(/\s+/);
      const bytes = hexValues.map(hex => parseInt(hex, 16));

      const mode = archModes[arch()];
      const result = await invoke("disassemble", {
        bytes: bytes,
        arch: arch(),
        mode: mode,
        endian: endianType()
      });

      // 显示反汇编结果（每行指令）
      setOutputResult(result.join('\n'));
    } catch (error) {
      setOutputResult(`错误: ${error}`);
    }
  }

  // 处理提交
  function processCode(e) {
    e.preventDefault();
    if (operation() === "disasm") {
      handleDisassemble();
    } else {
      handleAssemble();
    }
  }

  return (
    <main class="container">
      <h1>汇编/反汇编工具</h1>

      {/* 顶部操作栏 */}
      <div class="controls-row">
        <div class="control-group">
          <label for="arch-select">架构:</label>
          <select
            id="arch-select"
            value={arch()}
            onChange={(e) => setArch(e.target.value)}
          >
            <option value={Architecture.X86_64}>x86_64</option>
            <option value={Architecture.X86}>x86</option>
            <option value={Architecture.ARM}>ARM</option>
            <option value={Architecture.ARM64}>AArch64</option>
            <option value={Architecture.MIPS}>MIPS</option>
            <option value={Architecture.PPC}>PowerPC</option>
            <option value={Architecture.SPARC}>SPARC</option>
          </select>
        </div>

        <div class="control-group">
          <label for="operation-select">操作:</label>
          <select
            id="operation-select"
            value={operation()}
            onChange={(e) => setOperation(e.target.value)}
          >
            <option value="disasm">反汇编 (Disassemble)</option>
            <option value="asm">汇编 (Assemble)</option>
          </select>
        </div>

        <div class="control-group">
          <label for="endian-select">字节序:</label>
          <select
            id="endian-select"
            value={endianType()}
            onChange={(e) => setEndianType(e.target.value)}
          >
            <option value={EndianType.Little}>小端序 (Little Endian)</option>
            <option value={EndianType.Big}>大端序 (Big Endian)</option>
          </select>
        </div>
      </div>

      {/* 输入/输出区域 */}
      <div class="code-containers">
        <div class="code-container">
          <label for="input-code">输入{operation() === "disasm" ? "机器码" : "汇编代码"}:</label>
          <textarea
            id="input-code"
            value={inputCode()}
            onInput={(e) => setInputCode(e.target.value)}
            placeholder={operation() === "disasm" ?
              "输入十六进制机器码，例如: 48 89 5C 24 08..." :
              "输入汇编代码，例如: mov rax, rbx\nret"}
          />
        </div>

        <div class="code-container">
          <label for="output-result">输出结果:</label>
          <textarea
            id="output-result"
            value={outputResult()}
            readOnly
            placeholder="结果将显示在这里..."
          />
        </div>
      </div>

      {/* 底部控制区：基址输入框和执行按钮一行显示 */}
      <div class="bottom-controls">
        <div class="base-address-container">
          <label for="base-address">基址:</label>
          <input
            id="base-address"
            type="text"
            value={baseAddress()}
            onInput={(e) => setBaseAddress(e.target.value)}
            placeholder="0x0"
          />
        </div>

        <div class="action-buttons">
          <button onClick={processCode}>
            {operation() === "disasm" ? "反汇编" : "汇编"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
