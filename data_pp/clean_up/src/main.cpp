#include "json.hpp"
#include "format.hpp"
#include "boost/regex.hpp"

#include <cstdio>
#include <exception>
#include <memory>
#include <optional>
#include <iostream>
#include <string>


static size_t constexpr DEFAULT_CHUNK_SIZE {4096};
static std::string constexpr DEFAULT_INPUT_REC_SEP {"    },"};

static std::array<std::string, 1> const REMOVABLE_KEYS {
    ""
};
static std::array<std::string, 43> const DATE_KEYS {
    "DATA DA AQUISIÇÃO",
    "DATA DA PRÁTICA DO FACTO",
    "DATA DE ENTRADA REQUERIMENTO",
    "DATA",
    "Data Dec. Recorrida",
    "Data Depósito",
    "Data cheque",
    "Data da Decisão Singular",
    "Data da Decisão Sumária",
    "Data da Decisão",
    "Data da Operação",
    "Data da Reclamação",
    "Data da escritura de compra e venda",
    "Data de Alteração De Denominação",
    "Data de Apresentação do Pedido de Asilo",
    "Data de Constituição",
    "Data de Entrada",
    "Data de Início",
    "Data de Nascimento / Idade",
    "Data de Vencimento",
    "Data de durabilidade mínima",
    "Data de vencimento",
    "Data do Acordão",
    "Data do Acórdão",
    "Data do Apêndice",
    "Data do Diário da República",
    "Data do Movimento",
    "Data do início de comercialização",
    "Data do movimento",
    "Data dos pagamentos",
    "Data e Hora da Assinatura",
    "Data expedição",
    "Data limite de pagamento",
    "Data movimento",
    "Data",
    "DataValor da Operação",
    "Datas de Fixação",
    "Datas de pagamento da taxa fixa",
    "Datas de pagamento da taxa variável",
    "Datas",
    "Em que data regressou voluntariamente ao seu país de origem?",
    "Em que data teve lugar esse afastamento?",
    "Ordenante Data do Movimento"
};

static char const* const DOCUMENT_PATTERN {"\\{.*\\}"};
static char const* const DATE_PATTERN {"^\\s*(\\d{2})(/|-)(\\d{2})\\g2(\\d{4})\\s*$"};
static char const* const INDENT_PATTERN {"\n"};

struct FILE_deleter_t {
    void operator()(FILE* const f) const noexcept {
        std::fclose(f);
    }
};

struct c_mem_deleter_t {
    void operator()(void* const ptr) const noexcept {
        std::free(ptr);
    }
};


class document_stream_t {

public:
    document_stream_t(
        std::string input_rec_sep,
        std::string const& fn,
        std::shared_ptr<boost::regex> doc_regex_obj,
        size_t const chunk_size = DEFAULT_CHUNK_SIZE
    ) :
        m_input_rec_sep{std::move(input_rec_sep)},
        m_ifh{std::unique_ptr<std::FILE, FILE_deleter_t>{std::fopen(fn.c_str(), "r")}},
        m_chunk_size{chunk_size},
        m_buffer_capacity{0},
        m_buffer_size{0},
        m_buffer{std::unique_ptr<char, c_mem_deleter_t>{nullptr}},
        m_doc_regex_obj{std::move(doc_regex_obj)}
        {
            if(m_ifh.get() == nullptr)
                throw std::ios::failure{
                    string_format("IO error: failed to open file '%s'", fn.c_str())
                };

            this->read_chunk();
        }

    document_stream_t(
        std::string input_rec_sep,
        std::string const& fn,
        std::shared_ptr<boost::regex> doc_regex_obj,
        std::unique_ptr<char, c_mem_deleter_t> buffer,
        size_t const capacity,
        size_t const chunk_size = DEFAULT_CHUNK_SIZE
    ) :
        m_input_rec_sep{std::move(input_rec_sep)},
        m_ifh{std::unique_ptr<std::FILE, FILE_deleter_t>{std::fopen(fn.c_str(), "r")}},
        m_chunk_size{chunk_size},
        m_buffer_capacity{capacity},
        m_buffer_size{0},
        m_buffer{std::move(buffer)},
        m_doc_regex_obj{std::move(doc_regex_obj)}
        {
            if(m_ifh.get() == nullptr)
                throw std::ios::failure{
                    string_format("IO error: failed to open file '%s'", fn.c_str())
                };

            this->read_chunk();
        }

    std::optional<nlohmann::json> next_document(){

        char* pos {nullptr};
        do {
            if((pos = std::strstr(m_buffer.get(), m_input_rec_sep.c_str())) != nullptr)
                break;
        }
        while(this->read_chunk() > 0);

        char char_at_pos {};
        if(pos != nullptr){
            char_at_pos = pos[m_input_rec_sep.size()];
            pos[m_input_rec_sep.size()] = '\0';
        }

        boost::cmatch match_obj {};
        if(!boost::regex_search(m_buffer.get(), match_obj, *m_doc_regex_obj))
            return std::nullopt;

        if(pos != nullptr)
            pos[m_input_rec_sep.size()] = char_at_pos;

        m_document_buffer = {match_obj[0].begin(), match_obj[0].end()};

        this->adjust_buffer(const_cast<char*>(match_obj[0].end()));
        return std::make_optional(nlohmann::json::parse(m_document_buffer));
    }

    std::pair<std::unique_ptr<char, c_mem_deleter_t>, size_t> release_buffer() noexcept {
        return std::make_pair(std::move(m_buffer), m_buffer_capacity);
    }

private:
    std::string const m_input_rec_sep;
    std::unique_ptr<std::FILE, FILE_deleter_t> const m_ifh;
    size_t const m_chunk_size;
    size_t m_buffer_capacity;
    size_t m_buffer_size;
    std::unique_ptr<char, c_mem_deleter_t> m_buffer;
    std::shared_ptr<boost::regex> const m_doc_regex_obj;

    static std::string m_document_buffer;


    size_t read_chunk(){
        if(!this->resize_buffer())
            throw std::bad_alloc();

        size_t const chars_read {std::fread(
            m_buffer.get() + m_buffer_size,
            sizeof(*m_buffer),
            std::min(m_chunk_size, m_buffer_capacity - m_buffer_size),
            m_ifh.get()
        )};
        m_buffer_size += chars_read;

        return chars_read;
    }

    void adjust_buffer(char* src_pos) noexcept {

        size_t i {0};
        m_buffer_size = 0;

        while(*src_pos != '\0' && src_pos != (m_buffer.get() + m_buffer_capacity + 1)){
            ++m_buffer_size;
            *(m_buffer.get() + i) = *src_pos;
            ++src_pos;
            ++i;
        }

        while(src_pos != (m_buffer.get() + m_buffer_capacity + 1)){
            *(m_buffer.get() + i) = *src_pos;
            ++src_pos;
            ++i;
        }

        std::memset(m_buffer.get() + i, 0, (m_buffer_capacity + 1 - i) * sizeof(*m_buffer));
    }

    bool resize_buffer() noexcept {

        if(m_buffer_size == m_buffer_capacity){

            m_buffer_capacity = (m_buffer_capacity == 0) ? m_chunk_size : (m_buffer_capacity * 2);

            char* const new_ptr {
                static_cast<char*>(
                    std::realloc(m_buffer.get(), (m_buffer_capacity + 1) * sizeof(*m_buffer))
                )
            };
            if(new_ptr == nullptr)
                return false;

            std::memset(
                new_ptr + m_buffer_size,
                0,
                (m_buffer_capacity + 1 - m_buffer_size) * sizeof(*new_ptr)
            );

            static_cast<void>(m_buffer.release());
            m_buffer.reset(new_ptr);
        }

        return true;
    }
};

std::string document_stream_t::m_document_buffer {};


static void delete_keys(nlohmann::json& json_obj){
    for(std::string const& k : REMOVABLE_KEYS)
        json_obj.erase(k);
}

static void normalize_dates(nlohmann::json& json_obj, boost::regex const& regex_obj){

    static boost::cmatch match_obj {};

    for(std::string const& k : DATE_KEYS)

        if(json_obj.contains(k) && json_obj[k].is_string()){

            std::string const& value {json_obj[k]};
            if(!boost::regex_search(value.c_str(), match_obj, regex_obj))
                std::cerr << string_format(
                    "'%s' doesn't match the DD/MM/YYYY format (@ key '%s'); skipping...\n",
                    value.c_str(), k.c_str()
                );
            else {
                json_obj[k] = string_format(
                    "%.4s-%.2s-%.2s",
                    match_obj[4].begin(),
                    match_obj[3].begin(),
                    match_obj[1].begin()
                );
            }
        }
}

static void prettify(std::string& str, boost::regex const& regex_obj){
    str = boost::regex_replace(str, regex_obj, "\n\t");
}

int main(int const argc, char const* const* const argv){

    if(argc < 2){
        std::fprintf(stderr, "usage: %s FILE...\n", argv[0]);
        return 1;
    }

    std::shared_ptr<boost::regex> const doc_regex_obj {
        std::make_shared<boost::regex>(
            DOCUMENT_PATTERN,
            boost::regex::perl | boost::regex::mod_s
        )
    };

    boost::regex const date_regex_obj {
        DATE_PATTERN,
        boost::regex::perl | boost::regex::no_mod_m
    };

    boost::regex const indent_regex_obj {
        INDENT_PATTERN,
        boost::regex::perl
    };

    int status {0};
    std::unique_ptr<char, c_mem_deleter_t> buffer {nullptr};
    size_t capacity {0};

    for(int i {1}; i < argc; ++i){
        try {
            document_stream_t doc_stream {
                i == 1 ?
                    document_stream_t{DEFAULT_INPUT_REC_SEP, argv[i], doc_regex_obj} :
                    document_stream_t{
                        DEFAULT_INPUT_REC_SEP,
                        argv[i],
                        doc_regex_obj,
                        std::move(buffer),
                        capacity
                    }
            };

            std::string const out_fn {string_format("%s.new", argv[i])};
            std::unique_ptr<std::FILE, FILE_deleter_t> const out_fh {
                std::fopen(out_fn.c_str(), "w")
            };
            if(out_fh.get() == nullptr)
                throw std::ios::failure{
                    string_format("IO error: failed to open file '%s'", out_fn.c_str())
                };

            std::fwrite("[\n\t", sizeof(char), 3, out_fh.get());
            bool is_first {true};

            for(
                std::optional<nlohmann::json> j {doc_stream.next_document()};
                j.has_value();
                j = doc_stream.next_document()
            ){

                delete_keys(j.value());
                normalize_dates(j.value(), date_regex_obj);

                if(!is_first)
                    std::fwrite(",\n\t", sizeof(char), 3, out_fh.get());
                is_first = false;

                std::string j_as_str {j.value().dump(4)};
                prettify(j_as_str, indent_regex_obj);
                std::fwrite(
                    j_as_str.c_str(),
                    sizeof(*j_as_str.c_str()),
                    j_as_str.size(),
                    out_fh.get()
                );
            }
            std::fwrite("\n]\n", sizeof(char), 3, out_fh.get());

            auto&& [r_buffer, r_capacity] {doc_stream.release_buffer()};
            buffer = std::move(r_buffer);
            capacity = r_capacity;
        }
        catch(std::exception const& e){
            std::cerr << e.what() << '\n';
            status = 2;
        }
    }

    return status;
}
