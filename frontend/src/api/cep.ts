export type ViaCepResponse = {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
};

export async function fetchAddressByCep(cepRaw: string): Promise<ViaCepResponse> {
    const cep = cepRaw.replace(/\D/g, "");
    if (cep.length !== 8) {
        throw new Error("CEP inválido");
    }

    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) {
        throw new Error("Falha ao consultar CEP");
    }

    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) {
        throw new Error("CEP não encontrado");
    }

    return data;
}