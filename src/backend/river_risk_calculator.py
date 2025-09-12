# Ecologic/src/backend/river_risk_processor.py

import pandas as pd

# Mapeamento para níveis de risco (Baixo, Médio, Alto) para uma escala numérica
# Ajustado para considerar 'Critico' também, caso apareça diretamente no CSV
RISK_LEVEL_MAP = {
    'baixo': 1,
    'medio': 2,
    'alto': 3,
    'critico': 4 # Adicionado um nível numérico para 'Critico'
}

# Limites de score para classificação final de risco (0-10)
# Estes são os thresholds que a EY usa para classificar os rios
# Estes valores são arbitrários para demonstração, ajuste conforme a lógica da EY
RISK_CLASSIFICATION_THRESHOLDS = {
    'Critico': 7.5, 
    'Alto': 5.0,    
    'Medio': 2.5,   
    'Baixo': 0.0    
}

def map_risk_level_to_numeric(level):
    """Converte nível de risco textual para numérico usando o RISK_LEVEL_MAP."""
    if pd.isna(level) or str(level).strip() == '':
        return 0 # Retorna 0 para valores ausentes ou vazios
    return RISK_LEVEL_MAP.get(str(level).lower(), 0) # Garante que seja string e minúsculo

def calculate_final_river_risk_score(row):
    """
    Calcula a nota de risco final para um rio a partir de Frequência, Impacto e Vulnerabilidade.
    Assume que as colunas 'Frequencia', 'Impacto' e 'Vulnerabilidade' já foram padronizadas.
    O score final é escalado para uma faixa de 0 a 10.
    """
    freq_numeric = map_risk_level_to_numeric(row.get('Frequencia'))
    impact_numeric = map_risk_level_to_numeric(row.get('Impacto'))
    vulner_numeric = map_risk_level_to_numeric(row.get('Vulnerabilidade'))
    
    # Pesos (AJUSTÁVEIS conforme a lógica exata de ponderação da EY no Ecologic 1.0)
    # Estes pesos são um exemplo. Se a EY usava pesos diferentes, este é o lugar para ajustá-los.
    weight_freq = 0.25
    weight_impact = 0.50 
    weight_vulner = 0.25
    
    weighted_sum = (freq_numeric * weight_freq) + \
                   (impact_numeric * weight_impact) + \
                   (vulner_numeric * weight_vulner)
    
    # Escalar o resultado para uma faixa de 0 a 10.
    # Max_score_componente = 4 (do 'Critico' no RISK_LEVEL_MAP)
    # Max_possible_weighted_sum = (4 * weight_freq) + (4 * weight_impact) + (4 * weight_vulner) = 4
    max_score_component = max(RISK_LEVEL_MAP.values()) # O maior valor numérico no nosso mapa
    max_possible_weighted_sum = (max_score_component * weight_freq) + \
                                (max_score_component * weight_impact) + \
                                (max_score_component * weight_vulner)
    
    if max_possible_weighted_sum == 0: 
        return 0.0 # Evitar divisão por zero se todos os pesos forem zero (improvável)
    
    final_risk_score = (weighted_sum / max_possible_weighted_sum) * 10 
    
    # Garante que o score fique entre 0 e 10 e arredonda para 2 casas decimais
    return round(max(0.0, min(10.0, final_risk_score)), 2)

def classify_river_risk_level(score):
    """
    Classifica a nota de risco numérica (0-10) em 'Critico', 'Alto', 'Medio', 'Baixo', 'Nenhum'.
    """
    if pd.isna(score):
        return 'Nenhum'
    elif score >= RISK_CLASSIFICATION_THRESHOLDS['Critico']:
        return 'Critico'
    elif score >= RISK_CLASSIFICATION_THRESHOLDS['Alto']:
        return 'Alto'
    elif score >= RISK_CLASSIFICATION_THRESHOLDS['Medio']:
        return 'Medio'
    elif score > RISK_CLASSIFICATION_THRESHOLDS['Baixo']: # Para scores > 0
        return 'Baixo'
    else: # Score 0 ou menor
        return 'Nenhum'

# --- Bloco de teste de verificação ---
if __name__ == "__main__":
    print("\n--- Testando river_risk_calculator.py ---")
    
    # Cria um DataFrame de exemplo para testar as funções
    data_exemplo = {
        'Frequencia': ['Alto', 'Medio', 'Baixo', 'Critico', 'Nenhum', 'alto', ''],
        'Impacto': ['Critico', 'Alto', 'Medio', 'Baixo', 'Medio', 'CRITICO', pd.NA],
        'Vulnerabilidade': ['Medio', 'Baixo', 'Alto', 'Critico', '', 'baixo', 'Alto']
    }
    df_teste = pd.DataFrame(data_exemplo)
    print("\nDataFrame de teste inicial:")
    print(df_teste.to_string())

    df_teste['calculated_river_risk_score'] = df_teste.apply(calculate_final_river_risk_score, axis=1)
    df_teste['river_risk_classification'] = df_teste['calculated_river_risk_score'].apply(classify_river_risk_level)

    print("\nDataFrame de teste com scores e classificações de rios:")
    print(df_teste.to_string())

    # Exemplo de ajuste dos thresholds
    print("\n--- Testando com thresholds ajustados (exemplo) ---")
    RISK_CLASSIFICATION_THRESHOLDS['Critico'] = 8.0 # Aumentando o limiar para Crítico
    df_teste['river_risk_classification_adjusted'] = df_teste['calculated_river_risk_score'].apply(classify_river_risk_level)
    print(df_teste[['calculated_river_risk_score', 'river_risk_classification', 'river_risk_classification_adjusted']].to_string())

    print("\n--- Teste de river_risk_processor.py concluído ---")