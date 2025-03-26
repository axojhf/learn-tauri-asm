// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use capstone::prelude::*;
use keystone_engine::{
    Arch as KsArch, Keystone, Mode as KsMode, OptionType as KsOptionType,
    OptionValue as KsOptionValue,
};
// use capstone::{Capstone, arch::ArchDetail, arch, Arch as CsArch, Mode as CsMode};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum Architecture {
    X86,
    X86_64,
    ARM,
    ARM64,
    MIPS,
    PPC,
    SPARC,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum EndianType {
    Little,
    Big,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn assemble(asm_str: &str, arch: Architecture, addr: u64) -> Result<Vec<u8>, String> {
    let ks_arch = match arch {
        Architecture::X86 => KsArch::X86,
        Architecture::X86_64 => KsArch::X86,
        Architecture::ARM => KsArch::ARM,
        Architecture::ARM64 => KsArch::ARM64,
        Architecture::MIPS => KsArch::MIPS,
        Architecture::PPC => KsArch::PPC,
        Architecture::SPARC => KsArch::SPARC,
    };

    // 转换模式
    // 注意：此处简化处理，实际使用时可能需要更详细的模式映射
    let ks_mode = match arch {
        Architecture::X86_64 => KsMode::MODE_64,
        Architecture::X86 => KsMode::MODE_32,
        Architecture::ARM => KsMode::ARM,
        Architecture::ARM64 => KsMode::ARM,
        Architecture::MIPS => todo!(),
        Architecture::PPC => todo!(),
        Architecture::SPARC => todo!(),
    };

    let ks = Keystone::new(ks_arch, ks_mode)
        .map_err(|e| format!("Failed to create Keystone instance: {:?}", e))?;


    let result = ks
        .asm(asm_str.to_string(), addr)
        .map_err(|e| format!("Assembly error: {:?}", e))?;

    Ok(result.bytes)
}

#[tauri::command]
fn disassemble(bytes: Vec<u8>, arch: Architecture, addr: u64) -> Result<Vec<String>, String> {
    let cs = match arch {
        Architecture::X86 => Capstone::new()
            .x86()
            .mode(arch::x86::ArchMode::Mode32)
            .build()
            .expect("Failed to create Capstone object"),
        Architecture::X86_64 => Capstone::new()
            .x86()
            .mode(arch::x86::ArchMode::Mode64)
            .build()
            .expect("Failed to create Capstone object"),
        Architecture::ARM => Capstone::new()
            .arm()
            .mode(arch::arm::ArchMode::Arm)
            .build()
            .expect("Failed to create Capstone object"),
        Architecture::ARM64 => Capstone::new()
            .arm64()
            .mode(arch::arm64::ArchMode::Arm)
            .build()
            .expect("Failed to create Capstone object"),
        Architecture::MIPS => todo!(),
        Architecture::PPC => todo!(),
        Architecture::SPARC => todo!(),
    };

    // 假设我们从地址0开始反汇编
    let insns = cs
        .disasm_all(&bytes, addr)
        .map_err(|e| format!("Disassembly error: {:?}", e))?;

    let mut result = Vec::new();
    for i in insns.iter() {
        let asm_str = format!(
            "{} {}",
            i.mnemonic().unwrap_or(""),
            i.op_str().unwrap_or("")
        );
        result.push(asm_str);
    }

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, assemble, disassemble])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
